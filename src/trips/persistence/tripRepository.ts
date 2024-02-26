import {EventStateData, TripRepository} from "../../tripTypes";
import {getCompleteTrip, getNextTrip} from "../nextTrip";
import {
    AsyncResult,
    doOnError,
    doOnSuccess,
    flatMap,
    flatMapAsync,
    flatMapErrorAsync,
    map,
    Result
} from "../../utilities/results";
import * as SQLite from "expo-sqlite";
import {createTransactionCreator, ExecuteSQL} from "../../utilities/databaseAccess";
import {saveInnerTrip} from "../save";
import {extractInsertId} from "../../utilities/rowMapper";
import {ensureTablesExist} from "./tripMigration";
import {createLogger, createLoggerFromParent, Logger} from "../../utilities/logger";
import {getTripData} from "../getTripData";
import {getMostRecentCompletedTrip, getTripWithMostRecentEvent} from "../getTripId";
import {RawTripRepository, RetrieveTripTransaction} from "./rawTripRepository";

export type BuildTripRepository = () => Promise<Result<string, TripRepository>>
export type BuildTripRepositoryToo = (rawTripRepository: RawTripRepository, parentLogger?: Logger) => AsyncResult<TripRepository>

export const buildTripRepository: BuildTripRepositoryToo = (rawTripRepository, parentLogger) => {
    const logger = createLoggerFromParent(parentLogger)("tripRepo")

    const asyncRepo: AsyncResult<TripRepository> = rawTripRepository.setup()
        .then(map(_ => {

            const repo: TripRepository = {
                nextTrip: () =>
                    rawTripRepository.getMostRecentCompletedTrip()
                        .then(map(({trip_id}) => trip_id))
                        .then(flatMapAsync(reetrieve(rawTripRepository)))
                        .then(flatMap(getNextTrip)),
                lastTrip: () =>
                    rawTripRepository.getMostRecentCompletedTrip()
                        .then(map(({trip_id}) => trip_id))
                        .then(flatMapAsync(reetrieve(rawTripRepository)))
                        .then(flatMap(getCompleteTrip)),
                save: trip =>
                    rawTripRepository.getCreateTripTransaction().then(flatMapAsync(t =>
                        saveInnerTrip(logger)({
                            saveEvent: t.insertEvent,
                            saveRoute: t.insertRoute,
                            saveEventLocation: t.insertEventLocation,
                            saveLocation: t.insertLocation,
                            saveEventRoute: t.insertEventRoute
                        }, trip)
                    ))
            }

            return repo
        }))


    return asyncRepo
}

type ReetrieveTrip = (rawTripRepository: RawTripRepository) => (tripId: number) => AsyncResult<AllData>

type RetrieveTrip = (retrieveTripTransaction: RetrieveTripTransaction) => (tripId: number) => AsyncResult<AllData>

const reetrieve: ReetrieveTrip = (rawTripRepository) => (tripId) => {
    return rawTripRepository.getRetrieveTripTransaction().then(flatMapAsync(tripTransaction => {
        return retrieveTrip(tripTransaction)(tripId)
    }))
}

const retrieveTrip: RetrieveTrip = (retrieveTripTransaction) => (tripId) =>
    Promise.all([retrieveTripTransaction.getEvents(tripId), retrieveTripTransaction.getRoutes(), retrieveTripTransaction.getLocations()]).then(([a, b, c]) =>
        a.flatMap(events =>
            b.flatMap(routes =>
                c.map(locations => ({
                    eventLocationsData: events.filter(it => 'location_id' in it).map(it => it as EventLocationData),
                    eventRoutesData: events.filter(it => 'route_id' in it).map(it => it as EventRouteData),
                    eventsData: events.filter(it => 'timestamp' in it).map(it => it as EventData),
                    locationsData: locations,
                    routesData: routes,
                    tripData: {
                        id: tripId
                    }
                })))))

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
                    getTripWithMostRecentEvent(executor, nextTripLogger, insertTrip(executor, nextTripLogger))
                        .then(flatMapAsync(getTripData(executor, nextTripLogger)))
                        .then(flatMap(getNextTrip)), nextTripLogger),
                save: (innerTrip) =>
                    transactionCreator((executor, pushOnRollback) =>
                        saveInnerTripWithLogger({
                            saveEvent: insertEvent(executor),
                            saveLocation: insertLocation(executor),
                            saveRoute: insertRoute(executor, saveLogger),
                            saveEventLocation: insertEventLocation(executor),
                            saveEventRoute: insertEventRoute(executor)
                        }, innerTrip), saveLogger),
                lastTrip: () => transactionCreator((executor, pushOnRollback) =>
                    getMostRecentCompletedTrip(executor, nextTripLogger)
                        .then(flatMapAsync(getTripData(executor, nextTripLogger)))
                        .then(flatMap(getCompleteTrip)), nextTripLogger)
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

const insertRoute = (execute: ExecuteSQL, logger: Logger) => (name: string, locationOneId: number, locationTwoId: number) => execute(
    "insert into routes (name, location_one_id, location_two_id) values (?, ?, ?)",
    [name, locationOneId, locationTwoId]
).then(flatMap(extractInsertId))
    .then(doOnSuccess(id => logger.debug("INSERTED ROUTE: " + id)))

const insertLocation = (execute: ExecuteSQL) => (name: string) =>
    execute("insert into locations (name) values (?)", [name]).then(flatMap(extractInsertId))

export const insertTrip = (execute: ExecuteSQL, logger: Logger) => () =>
    execute("INSERT INTO trips DEFAULT VALUES;", [])
        .then(doOnError(console.error))
        .then(flatMap(extractInsertId))
        .then(doOnSuccess(id => logger.debug("INSERTED TRIP " + id)))

