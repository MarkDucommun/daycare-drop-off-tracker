import {EventStateData, TripRepository} from "../trip";
import {getNextTrip} from "./nextTrip";
import {
    doOnError,
    doOnSuccess,
    failure,
    flatMap,
    flatMapAsync,
    flatMapErrorAsync,
    flatten,
    map,
    mapError,
    Result,
    success,
    successIfDefined,
    traverse
} from "../utilities/results";
import * as SQLite from "expo-sqlite";
import {createTransactionCreator, ExecuteSQL} from "../utilities/databaseAccess";
import {saveInnerTrip} from "./save";
import {extractInsertId, extractRowsDataForType} from "../utilities/rowMapper";
import {ensureTablesExist} from "./tripMigration";
import {createLogger, Logger} from "../utilities/logger";

export type BuildTripRepository = () => Promise<Result<string, TripRepository>>

export const buildDbTripRepository = (db: SQLite.SQLiteDatabase, logger?: Logger): BuildTripRepository => () => {

    const tripRepositoryLogger = logger ? logger.createChild("tripRepo") : createLogger("tripRepo");
    const transactionCreator = createTransactionCreator(db, tripRepositoryLogger);

    return transactionCreator(ensureTablesExist)
        .then(map(_ => {

            const nextTripLogger = tripRepositoryLogger.createChild("nextTrip");
            const saveLogger = tripRepositoryLogger.createChild("save");
            const saveInnerTripWithLogger = saveInnerTrip(saveLogger);
            return ({
                nextTrip: () => transactionCreator((executor, pushOnRollback) =>
                    success<string, AllData>({
                        tripData: {
                            id: 0
                        },
                        routesData: [],
                        locationsData: [],
                        eventsData: [],
                        eventRoutesData: [],
                        eventLocationsData: []
                    })
                        .flatMapAsync((allData) => {
                            const promise = getLocations(executor, nextTripLogger).then(map(addToAllData(allData, 'locationsData')));
                            return promise;
                        })
                        .then(flatMapAsync((allData) =>
                            getRoutes(executor).then(map(addToAllData(allData, 'routesData')))))
                        .then(flatMapAsync((allData) =>
                            getTripWithMostRecentEvent(executor, nextTripLogger)
                                .then(map(it => ({
                                    ...allData,
                                    tripData: {id: it}
                                })))))
                        .then(flatMapAsync((allData) =>
                            getTripEvents(executor)(allData.tripData.id).then(map(events => {
                                const eventRoutesData = events.filter(it => 'route_id' in it).map(it => it as EventRouteData)
                                const eventsLocationData = events.filter(it => 'location_id' in it).map(it => it as EventLocationData)
                                const eventsData = events.filter(it => 'timestamp' in it).map(it => it as EventData)
                                return {
                                    ...allData,
                                    eventRoutesData,
                                    eventLocationsData: eventsLocationData,
                                    eventsData
                                }
                            }))))
                        .then(flatMap(getNextTrip)), nextTripLogger),
                save: (innerTrip) =>
                    transactionCreator((executor, pushOnRollback) =>
                        saveInnerTripWithLogger({
                            saveEvent: insertEvent(executor),
                            saveLocation: insertLocation(executor),
                            saveRoute: insertRoute(executor, saveLogger),
                            saveEventLocation: insertEventLocation(executor),
                            saveEventRoute: insertEventRoute(executor)
                        }, innerTrip), saveLogger)
            });
        }))

}

const insertEventRoute = (execute: ExecuteSQL) => (eventId: number, routeId: number) =>
    execute(
        "insert into event_routes (event_id, route_id) values (?, ?)",
        [eventId, routeId]
    ).then(flatMap(extractInsertId))

const insertEventLocation = (execute: ExecuteSQL) => (eventId: number, locationId: number) =>
    execute(
        "insert into event_locations (event_id, location_id) values (?, ?)",
        [eventId, locationId]
    ).then(flatMap(extractInsertId))

const insertEvent = (execute: ExecuteSQL) => (tripId: number, state: EventStateData, timestamp: number, order: number) =>
    execute(
        "insert into events (trip_id, state, timestamp, \"order\") values (?, ?, ?, ?)",
        [tripId, state, timestamp, order]
    ).then(flatMap(extractInsertId))

type RecentTrip = {
    trip_id: number
    state: string
}

const recentTripExtractor = extractRowsDataForType<RecentTrip, keyof RecentTrip>(
    {key: 'trip_id', type: 'number', nullable: false},
    {key: 'state', type: 'string', nullable: false}
);
const getTripWithMostRecentEvent = (execute: ExecuteSQL, logger: Logger): Promise<Result<string, number>> =>
    execute("select trip_id, state from events order by timestamp desc limit 1")
        .then(flatMap(recentTripExtractor(logger)))
        .then(flatMap(trips => successIfDefined(trips[0])))
        .then(mapError(_ => "Failed to find a most recent trip"))
        .then(flatMap(failIfTripIsComplete))
        .then(doOnError(logger.error))
        .then(flatMapErrorAsync(insertTrip(execute, logger)))

const failIfTripIsComplete = ({trip_id, state}: RecentTrip): Result<string, number> =>
    state == "complete" ? failure("Most recent trip is complete") : success(trip_id)

type EventRow = {
    id: number
    trip_id: number
    state: string
    timestamp: number
    order: number
    route_id: number | null
    location_id: number | null
}

const extractEventData = extractRowsDataForType<EventRow, keyof EventRow>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'trip_id', type: 'number', nullable: false},
    {key: 'state', type: 'string', nullable: false},
    {key: 'timestamp', type: 'number', nullable: false},
    {key: 'order', type: 'number', nullable: false},
    {key: 'route_id', type: 'number', nullable: true},
    {key: 'location_id', type: 'number', nullable: true}
)

type AllEventData = EventData | EventLocationData | EventRouteData

const getTripEvents = (execute: ExecuteSQL) => async (tripId: number): Promise<Result<string, Array<AllEventData>>> =>
    execute(`SELECT e.*, l.location_id, r.route_id
             FROM events e
                      LEFT JOIN event_locations l ON e.id = l.event_id
                      LEFT JOIN event_routes r ON e.id = r.event_id
             WHERE e.trip_id = ?`, [tripId])
        .then(flatMap(extractEventData()))
        .then(flatMap(transformEventRowsToAllEventData))

const transformEventRowsToAllEventData = (events: Array<EventRow>): Result<string, Array<AllEventData>> =>
    traverse(events.flatMap(eventRowToAllEventData)).map(flatten)

const eventRowToAllEventData = (eventRow: EventRow): Result<string, Array<AllEventData>> => {
    const {eventData, route_id, location_id, id} = eventRowToEventData(eventRow)
    if (route_id && location_id) {
        return failure<string, Array<AllEventData>>("")
    } else if (route_id) {
        return success<string, Array<AllEventData>>([eventData, {
            route_id,
            event_id: id
        }])
    } else if (location_id) {
        return success<string, Array<AllEventData>>([eventData, {
            location_id,
            event_id: id
        }])
    } else {
        return success<string, Array<AllEventData>>([eventData])
    }
}

const eventRowToEventData = (
    {
        id,
        trip_id,
        state,
        timestamp,
        order,
        route_id,
        location_id
    }: EventRow): {
    id: number,
    eventData: EventData,
    route_id: number | null,
    location_id: number | null
} => {
    return {
        id,
        eventData: {id, trip_id, state, timestamp, order},
        route_id,
        location_id
    }
}

const insertRoute = (execute: ExecuteSQL, logger: Logger) => (name: string, locationOneId: number, locationTwoId: number) => execute(
    "insert into routes (name, location_one_id, location_two_id) values (?, ?, ?)",
    [name, locationOneId, locationTwoId]
).then(flatMap(extractInsertId))
    .then(doOnSuccess(id => logger.debug("INSERTED ROUTE: " + id)))

const routesDataExtractor = extractRowsDataForType<RouteData, keyof RouteData>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'name', type: 'string', nullable: false},
    {key: 'location_one_id', type: 'number', nullable: false},
    {key: 'location_two_id', type: 'number', nullable: false},
)

const getRoutes = (execute: ExecuteSQL): Promise<Result<string, Array<RouteData>>> =>
    execute("select * from routes").then(flatMap(routesDataExtractor()))

const insertLocation = (execute: ExecuteSQL) => (name: string) =>
    execute("insert into locations (name) values (?)", [name]).then(flatMap(extractInsertId))

const locationRowsExtractor = extractRowsDataForType<LocationData, keyof LocationData>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'name', type: 'string', nullable: false}
)
export const getLocations = (execute: ExecuteSQL, logger: Logger): Promise<Result<string, Array<LocationData>>> =>
    execute("select * from locations")
        .then(flatMap(locationRowsExtractor()))
        .then(doOnSuccess(locations => logger.debug(`GOT ${locations.length} LOCATIONS`)))

export const insertTrip = (execute: ExecuteSQL, logger: Logger) => () =>
    execute("INSERT INTO trips DEFAULT VALUES;", [])
        .then(doOnError(console.error))
        .then(flatMap(extractInsertId))
        .then(doOnSuccess(id => logger.debug("INSERTED TRIP " + id)))

const addToAllData = <T extends keyof AllData, S extends AllData[T]>(allData: AllData, key: T) => (s: S): AllData => ({
    ...allData,
    [key]: s
})
