import {failure, Result, success, todo, traverse} from "./results";
import {
    CompletedTrip,
    InboundTripSelector,
    InnerTrip,
    MovingTrip,
    OutboundTripSelector,
    PendingTrip,
    PersistedInnerTrip,
    StoppedTrip,
    Trip,
    TripEvent,
    TripRepository,
    TripState
} from "./trip";
import * as SQLite from "expo-sqlite";
import {ResultSet, SQLiteDatabase, SQLStatementArg} from "expo-sqlite";


type AllTripData = {
    tripData: TripData,
    tripEventsData: TripEventData[]
}

function rowsToTripData({rows}: ResultSet): Result<string, AllTripData | null> {
    const tripData: TripData = {
        id: rows[0].id,
        inboundRouteId: rows[0].inbound_route_id,
        outboundRouteId: rows[0].inbound_route_id
    }
    const tripEventsData = rows.map((row): TripEventData => {
        // TODO check if all trip_events have same trip id
        // TODO check to make sure all status's are valid
        return ({
            id: row.id,
            tripId: row.trip_id,
            state: row.status,
            timestampMillis: row.timestamp_ms
        })
    })

    return success({
        tripData,
        tripEventsData
    })
}

type Row = { [column: string]: any }

async function selectRoutes(tx: SQLite.SQLTransactionAsync): Promise<Result<string, Row[]>> {
    try {
        return success((await tx.executeSqlAsync("select * from routes")).rows)
    } catch (e: any) {
        if ('message' in e) {
            return failure(e.message)
        } else {
            return failure<string, Row[]>("Error reading database when selecting all routes")
        }
    }
}

type ExecuteSQL = (sql: string, args?: string | number | null[]) => Promise<Result<string, ResultSet>>

function createSqlExecutor(tx: SQLite.SQLTransactionAsync): ExecuteSQL {
    return async (sql, args) => {
        try {
            return success(await tx.executeSqlAsync(sql, args as SQLStatementArg[]))
        } catch (e: any) {
            if ('message' in e) {
                return failure(e.message)
            } else {
                return failure<string, ResultSet>("Error executing SQL")
            }
        }
    }
}

async function selectLastTripDataToo(execute: ExecuteSQL): Promise<Result<string, ResultSet>> {
    return (await execute("SELECT t.*, te.* FROM trips t LEFT JOIN trip_events te ON t.id = te.trip_id WHERE trip_id = (SELECT trip_id FROM trip_events ORDER BY timestamp_ms DESC) ORDER BY te.timestamp_ms DESC"))
}

async function selectLastTripData(tx: SQLite.SQLTransactionAsync): Promise<Result<string, Row[]>> {
    try {
        const {rows} = await tx
            .executeSqlAsync("SELECT t.*, te.* FROM trips t LEFT JOIN trip_events te ON t.id = te.trip_id WHERE trip_id = (SELECT trip_id FROM trip_events ORDER BY timestamp_ms DESC) ORDER BY te.timestamp_ms DESC", [])
        return success(rows)
    } catch (e: any) {
        if ('message' in e) {
            return failure(e.message)
        } else {
            return failure<string, Row[]>("Error reading database when selecting last trip")
        }
    }
}

async function persistInnerTrip(tx: SQLite.SQLTransactionAsync, innerTrip: InnerTrip): Promise<Result<string, number>> {
    try {
        const {insertId} = await tx
            .executeSqlAsync("insert into trips (outbound_route_id, inbound_route_id) values (null, null)")
        if (insertId) return success(insertId)
        else return fail("Error inserting trip into database")
    } catch (e: any) {
        if ('message' in e) {
            return failure(e.message)
        } else {
            return failure<string, number>("Error inserting trip into database")
        }
    }
}

function allTripDataToTrip(allTripData: AllTripData): Trip {
    const {tripData, tripEventsData} = allTripData
    const tripEvents = tripEventsData.map((data): TripEvent => {
        return {
            persisted: true,
            timestamp: data.timestampMillis,
            state: data.state
        }
    })

    const innerTrip = createInnerTrip(tripEvents)
    innerTrip.id = tripData.id

    const lastEvent = tripEventsData[0];

    switch (lastEvent.state) {
        case "pending":
            return buildPendingTrip(innerTrip)
        case "moving":
            return buildMovingTrip(innerTrip)
        case "stoplight":
        case "train":
        case "drop-off":
            return buildStoppedTrip(innerTrip)
        case "complete":
            if (tripData.outboundRouteId == null) {
                throw Error()
            } else if (tripData.inboundRouteId == null) {
                throw Error()
            } else {
                return createPendingTrip(createInnerTrip())
            }
    }
}

type WithTransaction<T> = (tx: SQLite.SQLTransactionAsync, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>

type InTransaction<T> = (executor: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>

async function useDbAsync<T>(db: SQLite.SQLiteDatabase, fn: WithTransaction<T>): Promise<Result<string, T>> {
    return new Promise(async (resolve) => {
        const onRollback: Array<() => void> = []
        try {
            await db.transactionAsync(async tx => resolve(fn(tx, onRollback.push)));
        } catch (e: any) {
            onRollback.forEach(it => it())
            if ('message' in e) {
                return failure(e.message)
            } else {
                return failure<String, Row[]>("Error reading database when selecting last trip")
            }
        }
    })
}

type Transaction<T> = (fn: InTransaction<T>) => Promise<Result<string, T>>

async function useSqlExecutor<T>(db: SQLite.SQLiteDatabase, fn: InTransaction<T>): Promise<Result<string, T>> {
    return new Promise(async (resolve) => {
        const onRollback: Array<() => void> = []
        try {
            await db.transactionAsync(async tx =>
                resolve(fn(createSqlExecutor(tx), onRollback.push)));
        } catch (e: any) {
            onRollback.forEach(it => it())
            if ('message' in e) {
                return failure(e.message)
            } else {
                return failure<String, Row[]>("Error reading database when selecting last trip")
            }
        }
    })
}

async function usePersistedTrip(tx: SQLite.SQLTransactionAsync, innerTrip: InnerTrip, addOnRollback: (fn: () => void) => void): Promise<Result<string, PersistedInnerTrip>> {
    if (innerTrip.id == null) {
        return (await persistInnerTrip(tx, innerTrip))
            .map((id) => {
                addOnRollback(() => innerTrip.id = null)
                innerTrip.id = id
                return innerTrip as PersistedInnerTrip
            })
    } else {
        return success(innerTrip as PersistedInnerTrip)
    }
}

async function persistEvent(tx: SQLite.SQLTransactionAsync, tripId: number, tripEvent: TripEvent, addOnRollback: (fn: () => void) => void): Promise<Result<string, null>> {
    try {
        await tx.executeSqlAsync("insert into trip_events (trip_id, status, timestamp_ms) values (?, ?, ?)", [tripId, tripEvent.state, tripEvent.timestamp])
        tripEvent.persisted = true
        addOnRollback(() => tripEvent.persisted = false)
        return success(null)
    } catch (e: any) {
        if ('message' in e) {
            return failure(e.message)
        } else {
            return failure<string, null>("Error inserting trip event into database")
        }
    }
}

function getName(row: Row): Result<string, string> {
    if ('name' in row) {
        return success<string, string>(row.name)
    } else {
        return failure<string, string>("'routes' row missing expected key name")
    }
}

export function getTripRepository(db: SQLite.SQLiteDatabase): TripRepository {

    ensureTablesExist(db)

    return {
        nextTrip: (): Promise<Result<string, Trip>> =>
            useSqlExecutor<Trip>(db, async (executor) => {
                return (await selectLastTripDataToo(executor))
                    .flatMap(rowsToTripData)
                    .map((allTripData) => {
                        if (allTripData == null) {
                            return createPendingTrip(createInnerTrip())
                        } else {
                            return allTripDataToTrip(allTripData)
                        }
                    })
            }),
        save: (innerTrip: InnerTrip): Promise<Result<string, null>> =>
            useDbAsync<null>(db, async (tx, addOnRollback) =>
                (await usePersistedTrip(tx, innerTrip, addOnRollback))
                    .flatMapAsync(async innerTrip => {
                        const promises = innerTrip
                            .unsavedEvents()
                            .map(async event => await persistEvent(tx, innerTrip.id, event, addOnRollback));

                        return traverse(await Promise.all(promises)).map(() => null);
                    })),
        getRoutes: (): Promise<Result<string, Array<string>>> =>
            useDbAsync<Array<string>>(db, async (tx) =>
                (await selectRoutes(tx)).flatMap((rows) => traverse(rows.map(getName))))
    }
}


function ensureTablesExist(db: SQLite.SQLiteDatabase) {
    db.transaction((tx) => {
        tx.executeSql("PRAGMA foreign_keys = ON;")
        tx.executeSql("create table if not exists routes (id integer primary key not null, name text unique);")
        tx.executeSql("insert into routes (name) values (?)", ["Lake-Chestnut"]) // TODO if it doesn't exist - probably need to clear up old instances, will have a good opportunity to test migrations
        tx.executeSql("insert into routes (name) values (?)", ["Glenview-Lehigh"]) // TODO if it doesn't exist - probably need to clear up old instances, will have a good opportunity to test migrations
        tx.executeSql("create table if not exists trips (id integer primary key not null, outbound_route_id integer, inbound_route_id integer, foreign key (outbound_route_id) references routes(id), foreign key (inbound_route_id) references routes(id));");
        tx.executeSql("create table if not exists trip_events (id integer primary key not null, trip_id integer not null, status text not null, timestamp_ms integer not null, foreign key (trip_id) references trips(id));")
    });
}

type TripData = {
    id: number
    outboundRouteId: number | undefined
    inboundRouteId: number | undefined
}

type TripEventData = {
    id: number,
    tripId: number,
    state: TripState,
    timestampMillis: number,
}

function createInnerTrip(innerEvents: Array<TripEvent> = []): InnerTrip {
    return {
        addEvent(state: TripState): void {
            innerEvents.push({
                state,
                timestamp: Date.now(),
                persisted: false
            })
        },
        events(): Array<TripEvent> {
            return innerEvents;
        },
        unsavedEvents(): Array<TripEvent> {
            return innerEvents.filter(it => !it.persisted)
        },
        addId(id: number) {
            this['id'] = id
        },
        id: null
    }
}

function createPendingTrip(innerTrip: InnerTrip): PendingTrip {
    innerTrip.addEvent("pending")
    return buildPendingTrip(innerTrip)
}

function buildPendingTrip(innerTrip: InnerTrip): PendingTrip {
    return {
        type: "pending",
        start: createMovingTrip(innerTrip),
        innerTrip: () => innerTrip
    }
}

function createMovingTrip(innerTrip: InnerTrip): () => MovingTrip {
    return () => {
        innerTrip.addEvent("moving")
        return buildMovingTrip(innerTrip)
    }
}

function buildMovingTrip(innerTrip: InnerTrip): MovingTrip {
    return {
        type: "moving",
        stoplight: createStoppedTrip("stoplight", innerTrip),
        train: createStoppedTrip("train", innerTrip),
        dropOff: createStoppedTrip("drop-off", innerTrip),
        complete: createCompletedTrip(innerTrip),
        startTimeMillis: startTimes(innerTrip),
        innerTrip: () => innerTrip
    }
}

const startTimes = (innerTrip: InnerTrip) => ({
    trip: 0,
    currentSegment: 0
})

function createStoppedTrip(tripStatus: 'stoplight' | 'train' | 'drop-off', innerTrip: InnerTrip): () => StoppedTrip {
    return () => {
        innerTrip.addEvent(tripStatus)
        return buildStoppedTrip(innerTrip)
    }
}

function buildStoppedTrip(innerTrip: InnerTrip): StoppedTrip {
    return {
        type: "stopped",
        go: createMovingTrip(innerTrip),
        startTimeMillis: startTimes(innerTrip),
        innerTrip: () => innerTrip
    }
}

function createCompletedTrip(innerTrip: InnerTrip): () => CompletedTrip {
    return () => {
        innerTrip.addEvent('complete')
        return buildCompletedTrip(innerTrip)
    }
}

function buildCompletedTrip(innerTrip: InnerTrip): CompletedTrip {
    return {
        type: "completed",
        summarize: () => {
            return {}
        },
        assignRoute: (name: String) => todo(),
        innerTrip: () => innerTrip
    }
}

function buildInboundTripSelector(innerTrip: InnerTrip): InboundTripSelector {
    return {
        type: "inbound-selection",
        assignInboundRoute: (name): CompletedTrip => buildCompletedTrip(innerTrip)
    }
}

function buildOutboundTripSelector(innerTrip: InnerTrip): OutboundTripSelector {
    return {
        type: "outbound-selection",
        assignOutboundRoute: (name): InboundTripSelector => buildInboundTripSelector(innerTrip)
    }
}

function createOutboundTripSelector(innerTrip: InnerTrip): () => OutboundTripSelector {
    return () => {
        innerTrip.addEvent('complete')
        return buildOutboundTripSelector(innerTrip)
    }
}
