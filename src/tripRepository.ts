import {
    doOnError,
    failure,
    flatMap,
    flatMapAsync,
    map,
    mapError, recoverError,
    Result,
    success,
    successIfDefined,
    todo,
    traverse
} from "./results";
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
    TripState,
    TripSummary
} from "./trip";
import * as SQLite from "expo-sqlite";
import {ResultSet, SQLStatementArg} from "expo-sqlite";
import {createSqlExecutor, ExecuteSQL, InTransaction, Row, Transaction} from "./databaseAccess";


type AllTripData = {
    tripData: TripData,
    tripEventsData: TripEventData[]
}

function rowsToTripData({rows}: ResultSet): Result<string, AllTripData | null> {
    if (rows.length == 0) return success<string, AllTripData | null>(null)

    const tripData: TripData = {
        id: rows[0].trip_id,
        version: rows[0].version,
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

    return success<string, AllTripData | null>({
        tripData,
        tripEventsData
    })
}

const selectLastTripData = (execute: ExecuteSQL): Promise<Result<string, ResultSet>> => execute(
    `SELECT t.*, te.*
     FROM trips t
              LEFT JOIN trip_events te ON t.id = te.trip_id
     WHERE trip_id = (SELECT trip_id FROM trip_events ORDER BY timestamp_ms DESC)
     ORDER BY te.timestamp_ms, te.id DESC`);

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
                return buildOutboundTripSelector(innerTrip)
            } else if (tripData.inboundRouteId == null) {
                return buildInboundTripSelector(innerTrip)
            } else {
                return createPendingTrip(createInnerTrip())
            }
    }
}

const extractInsertId = ({insertId}: ResultSet) => insertId;

const extractVersion = ({rows}: ResultSet): Result<string, number> =>
    rows.length != 1 && !rows[0]['version'] && typeof rows[0]['version'] != "number" ?
        failure("Could not load version") : success(rows[0]['version'])

const checkVersion = (innerTrip: InnerTrip) => (currentVersion: number): Result<string, InnerTrip> => innerTrip.version == currentVersion ?
    success(innerTrip) : failure(`InnerTrip version mismatch (current: ${currentVersion}, innerTrip: ${innerTrip.version}), aborting database operation`)

const __updateInnerTrip = (execute: ExecuteSQL) => (innerTrip: InnerTrip): Promise<Result<string, ResultSet>> =>
    execute(
        "UPDATE trips SET (outbound_route_id, inbound_route_id, version) = (?, ?, ?) where id = ?",
        [innerTrip.outboundRoute, innerTrip.inboundRoute, innerTrip.version + 1, innerTrip.id]
    )

const selectTripVersionData = (execute: ExecuteSQL, innerTrip: InnerTrip) =>
    execute("SELECT version FROM trips WHERE id = ?", [innerTrip.id])

const updateInnerTrip = (execute: ExecuteSQL, innerTrip: InnerTrip) =>
    selectTripVersionData(execute, innerTrip)
        .then(flatMap(extractVersion))
        .then(flatMap(checkVersion(innerTrip)))
        .then(doOnError((e) => console.log("Check version: " + e)))
        .then(flatMapAsync(__updateInnerTrip(execute)))
        .then(map(extractInsertId))
        .then(flatMap(successIfDefined))
        .then(mapError((e) => `Could not update trip '${innerTrip.id}': ` + e))
        .then(map(innerTrip.incrementVersion))
        .then(map(a => innerTrip as PersistedInnerTrip))

const __insertInnerTrip = (execute: ExecuteSQL) =>
    execute("insert into trips (outbound_route_id, inbound_route_id, version) values (null, null, 1)")

const setIdAndIncrementVersionOnInnerTrip = (innerTrip: InnerTrip, pushOnRollback: (fn: () => void) => void) => (id: number): void => {
    pushOnRollback(innerTrip.setId(id))
    pushOnRollback(innerTrip.incrementVersion())
}

const logInsertId = (id: number) => console.log(`Created Trip with id '${id}'`)

const insertInnerTrip = async (execute: ExecuteSQL, pushOnRollback: (fn: () => void) => void, innerTrip: InnerTrip) =>
    (await __insertInnerTrip(execute))
        .map(extractInsertId)
        .flatMap(successIfDefined)
        .doOnSuccess(logInsertId)
        .doOnSuccess(setIdAndIncrementVersionOnInnerTrip(innerTrip, pushOnRollback))
        .mapError(() => "Could not insert new trip")
        .map(a => innerTrip as PersistedInnerTrip)

const persistInnerTripToo = (execute: ExecuteSQL, pushOnRollback: (fn: () => void) => void, innerTrip: InnerTrip): Promise<Result<string, PersistedInnerTrip>> =>
    innerTrip.id == null && innerTrip.version == 0 ?
        insertInnerTrip(execute, pushOnRollback, innerTrip) :
        updateInnerTrip(execute, innerTrip);

const __insertTripEvent = (execute: ExecuteSQL, tripId: number, tripEvent: TripEvent) =>
    execute(
        "insert into trip_events (trip_id, status, timestamp_ms) values (?, ?, ?)",
        [tripId, tripEvent.state, tripEvent.timestamp]
    )

const setPersistedOnTripEvent = (tripEvent: TripEvent, pushOnRollback: (fn: () => void) => void) => () => {
    tripEvent.persisted = true
    pushOnRollback(() => tripEvent.persisted = false)
}

const persistTripEvents = (execute: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => (innerTrip: PersistedInnerTrip) =>
    Promise.all(innerTrip
        .unsavedEvents()
        .map(persistTripEvent(execute, pushOnRollback, innerTrip.id)))
        .then(traverse)
const persistTripEvent = (execute: ExecuteSQL, pushOnRollback: (fn: () => void) => void, tripId: number) => async (tripEvent: TripEvent): Promise<Result<string, null>> =>
    (await __insertTripEvent(execute, tripId, tripEvent))
        .doOnSuccess(setPersistedOnTripEvent(tripEvent, pushOnRollback))
        .map(_ => null)

const getName = (row: Row): Result<string, string> => 'name' in row ?
    success(row.name) :
    failure("'routes' row missing expected key name");

const newPendingTrip = () => success<string, Trip>(createPendingTrip(createInnerTrip()))

export const getTripRepositoryToo = (createTransaction: Transaction): Promise<Result<string, TripRepository>> =>
    createTransaction(ensureTablesExistToo)
        .then(map(() => ({
                nextTrip: () =>
                    createTransaction(async (execute) =>
                        (await selectLastTripData(execute))
                            .flatMap(rowsToTripData)
                            .doOnSuccess(console.log)
                            .flatMap(successIfDefined)
                            .map(allTripDataToTrip)
                            .doOnSuccess(console.log)
                            .flatMapError(newPendingTrip)),
                save: async (innerTrip) =>
                    createTransaction(async (execute, pushOnRollback) =>
                        (await persistInnerTripToo(execute, pushOnRollback, innerTrip))
                            .flatMapAsync(persistTripEvents(execute, pushOnRollback))
                            .then(map(_ => null))),
                getRoutes: () =>
                    createTransaction(async (execute) =>
                        getRouteNames(await selectRoutesToo(execute)))
            }
        )));

const getRouteNames = (selectRoutesResults: Result<string, ResultSet>): Result<string, string[]> =>
    selectRoutesResults.flatMap(({rows}) => traverse(rows.map(getName)))

const selectRoutesToo = (execute: ExecuteSQL): Promise<Result<string, ResultSet>> =>
    execute("select * from routes")

async function ensureTablesExistToo(execute: ExecuteSQL): Promise<Result<string, null>> {
    return execute("PRAGMA foreign_keys = ON;")
        .then(flatMapAsync(() => execute("create table if not exists routes (id integer primary key not null, name text unique);")))
        .then(flatMapAsync(() => execute("insert into routes (name) values (?)", ["Lake-Chestnut"])))
        .then(map(_ => null))
        .then(doOnError(console.log))
        .then(recoverError(_ => null))
        .then(flatMapAsync(() => execute("insert into routes (name) values (?)", ["Glenview-Lehigh"])))
        .then(map(_ => null))
        .then(doOnError(console.log))
        .then(recoverError(_ => null))
        .then(flatMapAsync(() => execute("create table if not exists trips (id integer primary key not null, outbound_route_id integer, inbound_route_id integer, version integer not null, foreign key (outbound_route_id) references routes(id), foreign key (inbound_route_id) references routes(id));")))
        .then(flatMapAsync(() => execute("create table if not exists trip_events (id integer primary key not null, trip_id integer not null, status text not null, timestamp_ms integer not null, foreign key (trip_id) references trips(id));")))
        .then(map(_ => null))
}

type TripData = {
    id: number,
    version: number
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
    // TODO convert all accesses of InnerTrip to functions, make an underlying innerTripState that can move forwards and backwards in time like Redux
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
        setId(id) {
            this['id'] = id
            return () => this['id'] = null
        },
        incrementVersion() {
            this['version']++
            return () => this['version']--
        },
        inboundRoute: null,
        outboundRoute: null,
        version: 0,
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
        complete: createOutboundTripSelector(innerTrip),
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
        summarize: (): TripSummary => ({
            startTime: 0,
            duration: {
                moving: 0,
                atStoplight: 0,
                atDropOff: 0,
                atTrain: 0,
                total: 0
            },
            count: {
                stoplights: 0,
                dropOffs: 0,
                trains: 0
            }
        }),
        type: "completed",
        innerTrip: () => innerTrip
    }
}

function buildInboundTripSelector(innerTrip: InnerTrip): InboundTripSelector {
    return {
        type: "inbound-selection",
        innerTrip: () => innerTrip,
        assignInboundRoute: (name) => {
            innerTrip.inboundRoute = name
            return buildCompletedTrip(innerTrip)
        },
    }
}

function buildOutboundTripSelector(innerTrip: InnerTrip): OutboundTripSelector {
    return {
        type: "outbound-selection",
        innerTrip: () => innerTrip,
        assignOutboundRoute: (name) => {
            innerTrip.outboundRoute = name
            return buildInboundTripSelector(innerTrip)
        },
    }
}

function createOutboundTripSelector(innerTrip: InnerTrip): () => OutboundTripSelector {
    return () => {
        innerTrip.addEvent('complete')
        return buildOutboundTripSelector(innerTrip)
    }
}
