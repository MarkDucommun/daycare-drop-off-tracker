import {
    AsyncResult,
    doOnError,
    doOnSuccess,
    flatMap,
    Result,
    success,
    successIfDefined,
    todo,
    TODO
} from "../../utilities/results";
import {createTransactionCreator, ExecuteSQL, InTransaction, TransactionCreator} from "../../utilities/databaseAccess";
import {ensureTablesExist} from "./tripMigration";
import {createLoggerFromParent, Logger} from "../../utilities/logger";
import {extractInsertId, extractRowsDataForType} from "../../utilities/rowMapper";
import {ResultSet, SQLiteDatabase} from "expo-sqlite";
import {getRoutes} from "../getRoutes";
import {getLocations} from "../getLocations";
import {AllEventData, geEvents} from "../getEvents";

type BuildRawTripRepository = (parentLogger?: Logger) => RawTripRepository

type RawTripRepository = {
    setup: () => AsyncResult<null>
    insertTrip: () => AsyncResult<number> // TODO should this be on a retrieve next trip transaction?
    getTripWithMostRecentEvent: () => AsyncResult<TripIdAndState> // TODO should these be on a retrieve trip transaction?
    getMostRecentCompletedTrip: () => AsyncResult<TripIdAndState>
    getRetrieveTripTransaction: (tripId: number) => AsyncResult<RetrieveTripTransaction>
    getCreateTripTransaction: () => AsyncResult<CreateTripTransaction>
}

type RetrieveTripTransaction = {
    getLocations: () => AsyncResult<Array<LocationData>>
    getRoutes: () => AsyncResult<Array<RouteData>>
    getEvents: (tripId: number) => AsyncResult<Array<AllEventData>>
    getEventLocations: (eventId: number) => AsyncResult<Array<EventLocationData>> // TODO maybe this goes away?
    getEventRoutes: (eventId: number) => AsyncResult<Array<EventRouteData>> // TODO maybe this goes away?
}

type CreateTripTransaction = {
    insertLocation: (name: string) => AsyncResult<number>
    insertRoute: (name: string, locationOneId: number, locationTwoId: number) => AsyncResult<number>
    insertEvent: (tripId: number, state: string, timestamp: number, order: number) => AsyncResult<number>
    insertEventLocation: (eventId: number, locationId: number) => AsyncResult<number>
    insertEventRoute: (eventId: number, routeId: number) => AsyncResult<number>
}

export const createRawTripRepository = (db: SQLiteDatabase): BuildRawTripRepository => (parentLogger?: Logger) => {

    const tripRepositoryLogger = createLoggerFromParent(parentLogger)("tripRepo");
    const transactionCreator = createTransactionCreator(db, tripRepositoryLogger);

    return {
        setup: setup(transactionCreator, tripRepositoryLogger),
        insertTrip: insertTrip(transactionCreator, tripRepositoryLogger),
        getTripWithMostRecentEvent: () => transactionCreator(getTripWithMostRecentEvent, tripRepositoryLogger),
        getMostRecentCompletedTrip: () => transactionCreator(getMostRecentCompletedTrip, tripRepositoryLogger),
        getRetrieveTripTransaction: getRetrieveTripTransaction(transactionCreator, tripRepositoryLogger),
        getCreateTripTransaction: TODO()
    }
}

const setup = (transactionCreator: TransactionCreator, parentLogger?: Logger) => (): AsyncResult<null> => {
    const logger = createLoggerFromParent(parentLogger)("setup");
    return transactionCreator(ensureTablesExist, logger)
}

const insertTrip = (transactionCreator: TransactionCreator, parentLogger?: Logger) => (): AsyncResult<number> => {
    const logger = createLoggerFromParent(parentLogger)("insertTrip");
    return transactionCreator(insertTripQuery, logger)
}

const insertTripQuery: InTransaction<number> = (execute, _, logger) =>
    execute("INSERT INTO trips DEFAULT VALUES;")
        .then(doOnError(console.error))
        .then(flatMap(extractInsertId))
        .then(doOnSuccess(id => logger.debug("INSERTED TRIP " + id)))

const getTripWithMostRecentEvent: InTransaction<TripIdAndState> = (execute, _, logger) =>
    execute("select trip_id, state from events order by timestamp desc limit 1")
        .then(flatMap(extractSingleRecentTrip(logger)))

const getMostRecentCompletedTrip: InTransaction<TripIdAndState> = (execute, _, logger) =>
    execute("SELECT trip_id, state FROM events WHERE state = 'complete' ORDER BY timestamp DESC LIMIT 1")
        .then(flatMap(extractSingleRecentTrip((logger))))

const extractSingleRecentTrip = (logger: Logger) => (resultSet: ResultSet): Result<string, TripIdAndState> =>
    tripIdAndStateExtractor(logger)(resultSet)
        .flatMap(trips => successIfDefined(trips[0]))
        .mapError(_ => "Failed to find a matching trip")

type TripIdAndState = {
    trip_id: number
    state: string
}

const tripIdAndStateExtractor = extractRowsDataForType<TripIdAndState, keyof TripIdAndState>(
    {key: 'trip_id', type: 'number', nullable: false},
    {key: 'state', type: 'string', nullable: false}
);


const getRetrieveTripTransaction = (transactionCreator: TransactionCreator, parentLogger?: Logger) => (tripId: number): AsyncResult<RetrieveTripTransaction> => {

    const logger = createLoggerFromParent(parentLogger)("retrieveTripTransaction")

    return transactionCreator(async (executor, pushOnRollback, logger) =>
        success({
            getLocations: () => getLocations(executor, pushOnRollback, logger),
            getRoutes: () => getRoutes(executor, pushOnRollback, logger),
            getEvents: (tripId: number) => geEvents(tripId)(executor, pushOnRollback, logger),
            getEventLocations: async (eventId: number) => todo(),
            getEventRoutes: async (eventId: number) => todo()
        }), logger)
}

type BuildTransaction<T > = (transactionCreator: TransactionCreator, parentLogger?: Logger) => T

const getCreateTripTransactionL: BuildTransaction<RawTripRepository['getCreateTripTransaction']> = (transactionCreator, parentLogger) => () => {

    const logger = createLoggerFromParent(parentLogger)("createTripTransaction")

    return transactionCreator(async (executor, pushOnRollback, logger) =>
        success({
            insertLocation: insertLocation(executor, logger),
            insertRoute: insertRoute(executor, logger),
            insertEvent: insertEvent(executor, logger),
            insertEventLocation: insertEventLocation(executor, logger),
            insertEventRoute: insertEventRoute(executor, logger)
        }), logger)
}

const insertEventRoute = (execute: ExecuteSQL, logger: Logger) => (eventId: number, routeId: number) =>
    execute(
        "insert into event_routes (event_id, route_id) values (?, ?)",
        [eventId, routeId]
    ).then(flatMap(extractInsertId))

const insertEventLocation = (execute: ExecuteSQL, logger: Logger) => (eventId: number, locationId: number) =>
    execute(
        "insert into event_locations (event_id, location_id) values (?, ?)",
        [eventId, locationId]
    ).then(flatMap(extractInsertId))

const insertEvent = (execute: ExecuteSQL, logger: Logger) => (tripId: number, state: string, timestamp: number, order: number) =>
    execute(
        "insert into events (trip_id, state, timestamp, \"order\") values (?, ?, ?, ?)",
        [tripId, state, timestamp, order]
    ).then(flatMap(extractInsertId))

const insertRoute = (execute: ExecuteSQL, logger: Logger) => (name: string, locationOneId: number, locationTwoId: number) => execute(
    "insert into routes (name, location_one_id, location_two_id) values (?, ?, ?)",
    [name, locationOneId, locationTwoId]
).then(flatMap(extractInsertId))
    .then(doOnSuccess(id => logger.debug("INSERTED ROUTE: " + id)))

const insertLocation = (execute: ExecuteSQL, logger: Logger) => (name: string) =>
    execute("insert into locations (name) values (?)", [name]).then(flatMap(extractInsertId))
