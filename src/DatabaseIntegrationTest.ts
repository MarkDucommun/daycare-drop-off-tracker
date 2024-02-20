import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import {doOnError, doOnSuccess, failure, flatMapAsync, map, Result} from "./utilities/results";
import {createTransactionCreator} from "./utilities/databaseAccess";
import {buildDbTripRepository, insertTrip} from "./repository/tripRepository";
import {buildInnerTrip, emptyInnerTripState} from "./repository/nextTrip";
import {ensureTablesExist} from "./repository/tripMigration";
import {createLogger} from "./utilities/logger";


export async function cleanDatabaseFile() {
    const dbIntegrationTestFile = FileSystem.documentDirectory + 'SQLite/db-integration-test.db';
    if ((await FileSystem.getInfoAsync(dbIntegrationTestFile)).exists) {
        await FileSystem.deleteAsync(dbIntegrationTestFile)
    }

    const db = SQLite.openDatabase("db-integration-test.db");


    type TestThing = {
        id: number;
        name: string | null
    }

    // ROW MAPPER TEST
    // createTransactionCreator(db)((executor): Promise<Result<string, null>> => {
    //     return executor("create table if not exists tests (id INTEGER PRIMARY KEY NOT NULL, name TEXT);")
    //         .then(_ => executor("INSERT INTO tests (name) VALUES ('test')"))
    //         .then(_ => executor("INSERT INTO tests DEFAULT VALUES ;"))
    //         .then(_ => executor("SELECT * FROM tests;"))
    //         .then(flatMap((resultSet): Result<string, TestThing[]> => {
    //             const extractRowsDataForType1: ({rows}: ResultSet) => Result<string, TestThing[]> = extractRowsDataForType<TestThing, keyof TestThing>(
    //                 {key: 'id', type: 'number', nullable: false},
    //                 {key: 'name', type: 'string', nullable: true}
    //             );
    //             return extractRowsDataForType1(resultSet);
    //         }))
    //         .then(doOnSuccess(_ => console.log("GOT THE ROWS")))
    //         .then(doOnSuccess(console.log))
    //         .then(map(_ => null))
    // })

    const logger = createLogger("test", "TRACE");

    logger.fatal("FATAL")
    logger.error("ERROR")
    logger.warn("WARN")
    logger.info("INFO")
    logger.debug("DEBUG")
    logger.trace("TRACE")

    // logger.setLevel("DEBUG")

    // return;
    return createTransactionCreator(db)((executor) => ensureTablesExist(executor).then(flatMapAsync(_ => insertTrip(executor, logger)())))
        .then(doOnSuccess(tripId => logger.info(`TRIP ${tripId} INSERTED`)))
        .then(flatMapAsync(tripId => {
            const innerTripState = emptyInnerTripState(tripId);
            innerTripState.locations.push({id: null, name: 'one'}, {id: null, name: 'two'})
            innerTripState.routes['one'] = {
                two: [{id: null, name: 'a',}]
            }
            innerTripState.routes['two'] = {
                one: [{id: null, name: 'b'}]
            }
            innerTripState.events.unshift({id: null, state: {location: 'one', type: "origin"}, timestamp: 1, order: 1})
            innerTripState.events.unshift({id: null, state: 'moving', timestamp: 1, order: 3})
            innerTripState.events.unshift({id: null, state: 'destination', timestamp: 1, order: 4})
            innerTripState.events.unshift({id: null, state: {location: 'two', type: "destination"}, timestamp: 1, order: 5})
            innerTripState.events.unshift({id: null, state: {route: 'a'}, timestamp: 1, order: 6})

            return buildDbTripRepository(db, logger)()
                .then(doOnSuccess(_ => logger.info("GOT THE REPO")))
                .then(flatMapAsync(repository =>
                    repository.save(buildInnerTrip(innerTripState))
                        .then(doOnSuccess(_ => logger.info("TRIP SAVED")))
                        .then(flatMapAsync(_ => {
                            return repository.nextTrip()
                        }))
                        .then(doOnSuccess(trip => {
                            logger.info("SUCCESS")

                            const persistedLocations = trip.innerTrip().locations();

                            logger.debug("Trip ID: " + trip.innerTrip().id())
                            logger.debug(persistedLocations)

                            logger.debug(trip.innerTrip().routes({one: 'one', two: 'two'}))
                            logger.debug(trip.innerTrip().routes({one: 'two', two: 'one'}))

                            logger.debug(trip.innerTrip().events())

                            // expect(persistedLocations).toHaveLength(2)
                            // expect(persistedLocations.map(extractKey('id'))).toEqual([1, 2])
                            //
                            // const routesOne = trip.innerTrip().routes({one: 'one', two: 'two'});
                            // expect(routesOne).toHaveLength(1)
                            // expect(routesOne[0].name).toEqual('a')
                            // expect(routesOne[0].id).not.toBeNull()
                            //
                            // const routesTwo = trip.innerTrip().routes({one: 'two', two: 'one'});
                            // expect(routesOne).toHaveLength(1)
                            // expect(routesOne[0].name).toEqual('b')
                            // expect(routesOne[0].id).not.toBeNull()
                        }))
                ))
                .then(doOnError(logger.fatal))
                .then(doOnError(e => {
                    throw Error("Failed: " + e)
                }))
        }))


    // const transactionCreator = createTransactionCreator(db);

    // TODO rollback should happen when the InTransaction fn returns a failure

    // try {
    //     await db.transactionAsync(async (tx) => {
    //         // this will cause a rollback if it fails
    //         await tx.executeSqlAsync("CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY NOT NULL, name TEXT UNIQUE);")
    //
    //         // this will not cause a rollback as it is caught
    //         try {
    //             console.log(await tx.executeSqlAsync("SELECT count(*) FROM stars;"))
    //         } catch (e) {
    //             console.log(e)
    //         }
    //         // this will cause a rollback
    //         // throw Error("BLOWUP THE TRANSACTION")
    //     })
    // } catch (e) {
    //     console.log(e)
    // }
    //
    // console.log("HERE")

    // try {
    //     await db.transactionAsync(async (tx) => {
    //         console.log(await tx.executeSqlAsync("SELECT count(*) FROM routes;"))
    //         // await tx.executeSqlAsync("CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY NOT NULL, name TEXT UNIQUE);")
    //         // throw Error("BLOWUP THE TRANSACTION")
    //     })
    // } catch (e) {
    //     console.log(e)
    // }

    // console.log("1")
    //
    // await transactionCreator<null>(async (executor, pushOnRollback): Promise<Result<string, null>> => {
    //
    //     return (await executor("CREATE TABLE IF NOT EXISTS routes (id INTEGER PRIMARY KEY NOT NULL, name TEXT UNIQUE);"))
    //         .doOnError(console.log)
    //         .map(_ => null);
    //
    //     // (await executor("INSERT INTO table_doesnt_exist (id, row_doesnt_exist) VALUES (1, ?)", ["value doesnt exist"]))
    //     //     .doOnError(console.log)
    //     //     .map(_ => null);
    //
    //     // return todo("HERE IS TODO")
    // }).then(doOnError(console.log))
    //
    // console.log("2")

    // await transactionCreator<null>(async (executor, pushOnRollback) => {
    //     pushOnRollback(() => console.log("ROLLING BACK!"))
    //     return executor("INSERT INTO routes (name) VALUES ('test')")
    //         // .flatMapAsync(() => executor("INSERT INTO stars (name) VALUES ('test')"))
    //         .then(flatMapAsync(() => executor("UPDATE routes SET name = 'joe' WHERE id=1")))
    //         .then(flatMapAsync(() => executor("SELECT * FROM routes;")))
    //         .then(flatMapAsync(() => executor("DELETE FROM routes WHERE id = 1;")))
    //         .then(map(_ => null));
    //
    // }).then(doOnError(console.log));


    // await transactionCreator<null>(async (executor, _) => {
    //     return (await executor("SELECT count(*) FROM routes"))
    //         .map(_ => null);
    // });
}

const useTripRepository = () => {

}
