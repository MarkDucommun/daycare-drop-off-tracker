import {Location, TripRepository} from "../tripToo";
import {getNextTrip} from "./nextTrip";
import {flatMap, flatMapAsync, map, Result, success, todo} from "../results";
import * as SQLite from "expo-sqlite";
import {createTransactionCreator, ExecuteSQL} from "../databaseAccess";
import {saveInnerTrip} from "./save";
import {extractInsertId, extractRowsDataForType} from "./rowMapper";

type BuildTripRepository = () => Promise<Result<string, TripRepository>>

export const buildFakeTripRepository: BuildTripRepository = async () => {
    return success<string, TripRepository>({
        nextTrip: async () => {
            return getNextTrip({
                tripData: {
                    id: 1
                },
                routesData: [
                    {id: 1, name: 'Glenview -> Lehigh', location_one_id: 1, location_two_id: 2},
                    {id: 2, name: 'Lehigh -> Glenview', location_one_id: 2, location_two_id: 1}
                ],
                locationsData: [{id: 1, name: 'Home'}, {id: 2, name: 'Daycare'}],
                eventsData: [],
                eventRoutesData: [],
                eventLocationsData: []
            })
        },
        save: async () => todo()
    })
}

export const buildDbTripRepository = (db: SQLite.SQLiteDatabase): BuildTripRepository => () => {

    const transactionCreator = createTransactionCreator(db);

    return transactionCreator(ensureTablesExist)
        .then(map(_ => {
            return {
                nextTrip: () => transactionCreator((executor, pushOnRollback) => {
                    // todo get most recent event
                    // todo if most recent event is completed insert new trip and get id
                    // todo if most recent event is not complete pull all events

                    const addToAllData = <T extends keyof AllData, S extends AllData[T]>(allData: AllData, key: T) => (s: S): AllData => ({
                        ...allData,
                        [key]: s
                    })

                    return success<string, AllData>({
                        tripData: {
                            id: 0
                        },
                        routesData: [],
                        locationsData: [],
                        eventsData: [],
                        eventRoutesData: [],
                        eventLocationsData: []
                    })
                        .flatMapAsync((allData) =>
                            getLocations(executor).then(map(addToAllData(allData, 'locationsData'))))
                        .then(flatMapAsync((allData) =>
                            getRoutes(executor).then(map(addToAllData(allData, 'routesData')))))
                        .then(flatMap(getNextTrip))
                }),
                save: (innerTrip) => transactionCreator((executor, pushOnRollback) =>
                    saveInnerTrip({
                        saveEvent: insertEvent(executor),
                        saveLocation: insertLocation(executor),
                        saveRoute: insertRoute(executor),
                        saveEventLocation: insertEventLocation(executor),
                        saveEventRoute: insertEventRoute(executor)
                    }, innerTrip))
            }
        }))

}

const insertEventRoute = (execute: ExecuteSQL) => (eventId: number, routeId: number) =>
    execute(
        "insert into event_locations (event_id, route_id) values (?, ?)",
        [eventId, routeId]
    ).then(flatMap(extractInsertId))

const insertEventLocation = (execute: ExecuteSQL) => (eventId: number, locationId: number) =>
    execute(
        "insert into event_locations (event_id, location_id) values (?, ?)",
        [eventId, locationId]
    ).then(flatMap(extractInsertId))

const insertEvent = (execute: ExecuteSQL) => (tripId: number, state: string, timestamp: number, order: number) =>
    execute(
        "insert into events (trip_id, status, timestamp, order) values (?, ?, ?, ?)",
        [tripId, state, timestamp, order]
    ).then(flatMap(extractInsertId))

const insertRoute = (execute: ExecuteSQL) => (name: string, locationOneId: number, locationTwoId: number) => execute(
    "insert into routes (name, location_one_id, location_two_id) values (?, ?, ?)",
    [name, locationOneId, locationTwoId]
).then(flatMap(extractInsertId))

const routesDataExtractor = extractRowsDataForType<RouteData, keyof RouteData>(
    {key: 'id', type: 'number'},
    {key: 'name', type: 'string'},
    {key: 'location_one_id', type: 'number'},
    {key: 'location_two_id', type: 'number'},
)

const getRoutes = (execute: ExecuteSQL): Promise<Result<string, Array<RouteData>>> =>
    execute("select * from routes").then(flatMap(routesDataExtractor))

const insertLocation = (execute: ExecuteSQL) => (name: string) =>
    execute("insert into locations (name) values (?)", [name]).then(flatMap(extractInsertId))

const locationRowsExtractor = extractRowsDataForType<LocationData, keyof LocationData>(
    {key: 'id', type: 'number'},
    {key: 'name', type: 'string'}
)
export const getLocations = (execute: ExecuteSQL): Promise<Result<string, Array<LocationData>>> =>
    execute("select * from locations").then(flatMap(locationRowsExtractor))

const insertTrip = (execute: ExecuteSQL) => () =>
    execute("insert into trips () values ();", []).then(flatMap(extractInsertId))

function ensureTablesExist(execute: ExecuteSQL): Promise<Result<string, null>> {
    return execute("PRAGMA foreign_keys = ON;")
        .then(flatMapAsync(_ => execute("create table if not exists locations (id integer primary key not null, name text unique);")))
        .then(flatMapAsync(_ => execute("create table if not exists routes (id integer primary key not null, name text unique, location_one_id integer, location_two_id integer,foreign key (location_one_id) references locations(id), foreign key (location_two_id) references locations(id));")))
        .then(flatMapAsync(_ => execute("create table if not exists trips (id integer primary key not null);")))
        .then(flatMapAsync(_ => execute("create table if not exists events (id integer primary key not null, trip_id integer not null, status text not null, timestamp integer not null, \"order\" integer not null, foreign key (trip_id) references trips(id));")))
        .then(flatMapAsync(_ => execute("create table if not exists event_locations (id integer primary key not null, event_id integer not null, location_id integer not null, foreign key (event_id) references events(id), foreign key (location_id) references locations(id));")))
        .then(flatMapAsync(_ => execute("create table if not exists event_routes (id integer primary key not null, event_id integer not null, route_id integer not null, foreign key (event_id) references events(id), foreign key (route_id) references routes(id));")))
        .then(map(_ => null))
}