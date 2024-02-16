import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system";
import {doOnError, doOnSuccess, extractKey, failure, flatMap, flatMapAsync, map, Result, todo} from "./results";
import {ResultSet} from "expo-sqlite";
import {createTransactionCreator} from "./databaseAccess";
import {MovingTrip, PendingTrip, StoppedTrip, Trip, TripRepository} from "./trip";
import {buildDbTripRepository} from "./repository/tripRepository";
import {buildInnerTrip, buildInnerTripState, emptyInnerTripState} from "./repository/nextTrip";


export async function cleanDatabaseFile() {
    const dbIntegrationTestFile = FileSystem.documentDirectory + 'SQLite/db-integration-test.db';
    if ((await FileSystem.getInfoAsync(dbIntegrationTestFile)).exists) {
        await FileSystem.deleteAsync(dbIntegrationTestFile)
    }

    const db = SQLite.openDatabase("db-integration-test.db");

    const innerTripState = emptyInnerTripState(1);
    innerTripState.locations.push({id: null, name: 'one'}, {id: null, name: 'two'})
    innerTripState.routesToo!!['one'] = {
        two: [{id: null, name: 'a', }]
    }
    innerTripState.routesToo!!['two'] = {
        one: [{id: null, name: 'b'}]
    }

    buildDbTripRepository(db)()
        .then(doOnSuccess(_ => console.log("GOT THE REPO")))
        .then(flatMapAsync(repository =>
            repository.save(buildInnerTrip(innerTripState))
                .then(doOnSuccess(_ => console.log("TRIP SAVED")))
                .then(flatMapAsync(_ => {
                    return repository.nextTrip()
                }))
                .then(doOnSuccess(trip => {
                    const persistedLocations = trip.innerTrip().locations();

                    console.log(persistedLocations)

                    console.log(trip.innerTrip().routes({one: 'one', two: 'two'}))
                    console.log(trip.innerTrip().routes({one: 'two', two: 'one'}))

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
        .then(doOnError(console.log))
        .then(doOnError(e => { throw Error("Failed: " + e) }))

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

    const doSomeTripStuff = async (repository: TripRepository) => {
        return repository.nextTrip()
            .then(flatMapAsync(async (trip): Promise<Result<string, MovingTrip>> => {
                if (trip.type != 'pending') return failure("should be pending")

                const pendingTrip = trip as PendingTrip

                const movingTrip = pendingTrip.start();

                return repository.save(movingTrip.innerTrip()).then(map(_ => movingTrip))
            }))
            .then(flatMapAsync(repository.nextTrip))
            .then(flatMapAsync(async (trip): Promise<Result<string, StoppedTrip>> => {
                console.log("Trip Type: " + trip.type)

                if (trip.type != 'moving') return failure("should be moving")

                const movingTrip = trip as MovingTrip

                const stoppedTrip = movingTrip.stoplight()

                return repository.save(stoppedTrip.innerTrip()).then(map(_ => stoppedTrip))
            }))
    }


}

const useTripRepository = () => {

}