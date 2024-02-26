import {EventStateData, TripRepository} from "../../tripTypes";
import {getCompleteTrip, getNextTrip} from "../nextTrip";
import {doOnError, doOnSuccess, flatMap, flatMapAsync, map, Result} from "../../utilities/results";
import * as SQLite from "expo-sqlite";
import {createTransactionCreator, ExecuteSQL} from "../../utilities/databaseAccess";
import {saveInnerTrip} from "../save";
import {extractInsertId} from "../../utilities/rowMapper";
import {ensureTablesExist} from "./tripMigration";
import {createLogger, Logger} from "../../utilities/logger";
import {getTripData} from "../getTripData";
import {getMostRecentCompletedTrip, getTripWithMostRecentEvent} from "../getTripId";

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

