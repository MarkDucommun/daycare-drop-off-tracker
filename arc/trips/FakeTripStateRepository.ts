import {DatabaseAccess, RunResult, Statement} from "../utilities/database/DatabaseTypes";
import {AsyncResult} from "../utilities/results/results";
import {flatMap, flatMapAsync, map, recover, successIfDefined} from "../utilities/results/resultCurriers";
import {
    ConditionalTripState,
    Location,
    SavedLocation,
    TripState,
    TripStateRepository,
    TripStateSummary,
    TripStateWithoutOrigin,
    TripStateWithSavedOrigin
} from "./TripStateRepositoryType";
import {asyncSuccess} from "../utilities/results/successAndFailure";
import {toNull} from "../utilities/results/otherTransforms";
import {traverse, traverse2} from "../utilities/results/traverse";
import {createSimpleTypeSafeMapper, mapAll, transformAll} from "../utilities/typesafeMapping";

export const buildDatabaseTripStateRepository = async (database: DatabaseAccess): AsyncResult<TripStateRepository> =>
    migrate(database).then(map(constructRepository(database)))

async function migrate(database: DatabaseAccess): AsyncResult<null> {
    return database
        .execAsync(`
            create table if not exists locations
            (
                id   integer primary key not null,
                name text                not null unique
            );

            create index if not exists location_name_idx on locations (name);

            create table if not exists trips
            (
                id     integer primary key not null,
                origin integer             not null,
                foreign key (origin) references locations (id)
            )
        `)
        .then(map(toNull))
}

function constructRepository(database: DatabaseAccess): () => TripStateRepository {

    return () => ({
        summarizeAllTrips: summarizeAllTrips(database),
        save: save(database),
        currentTrip: currentTrip(database)
    })
}

function summarizeAllTrips(database: DatabaseAccess): TripStateRepository['summarizeAllTrips'] {

    return () => allTripsStatement(database)
        .then(flatMapAsync(getAll))
        .then(flatMap(mapAll(tripMapper)))
        .then(map(transformAll(rawTripSummaryToTripStateSummary)))
        .then(map(trips => [
            ...trips,
            {
                id: 1,
                origin: "Home",
                startTime: new Date(2024, 0, 2, 8).getTime(),
            },
            {
                id: 2,
                origin: "Home",
                startTime: new Date(2024, 0, 1, 8).getTime(),
                endTime: new Date(2024, 0, 1, 8, 30).getTime()
            },
        ]))
}

function save(database: DatabaseAccess): TripStateRepository['save'] {

    return async <T extends TripState>(tripState: T): AsyncResult<ConditionalTripState<T>> =>
        processLocations(database, tripState.locations)
            .then(flatMapAsync((locations) => {
                switch (tripState.type) {
                    case "trip-state-without-origin":
                        return createTripWithoutOrigin(locations)
                    case "trip-state-with-origin":
                        return createTripWithSavedOrigin(database, tripState.origin, locations)
                    default:
                        return asyncSuccess({} as ConditionalTripState<T>)
                }
            }))
}

type RawTrip = {
    trip_id: number,
    origin: string
    origin_id: number
}

const rawTripExtractor = createSimpleTypeSafeMapper<RawTrip>({
    trip_id: 'number',
    origin: 'string',
    origin_id: 'number'
})

const locationMapper = createSimpleTypeSafeMapper<Location>({
    id: 'number',
    name: 'string'
})

function currentTrip(database: DatabaseAccess): TripStateRepository['currentTrip'] {

    return async () => {
        const tripAsyncResult = database
            .prepareAsync(`
                SELECT locations.name as origin, locations.id as origin_id, MAX(trips.id) as trip_id
                FROM trips
                         LEFT JOIN locations ON trips.origin = locations.id
            `)
            .then(flatMapAsync(getOne))
            .then(flatMap(rawTripExtractor))
            .then(map(trip => trip as RawTrip | null))
            .then(recover(null as RawTrip | null))

        const locationsAsyncResult = database
            .prepareAsync(`
                SELECT *
                FROM locations
            `)
            .then(flatMapAsync(getAll))
            .then(flatMap(mapAll(locationMapper)))

        return Promise.all([tripAsyncResult, locationsAsyncResult])
            .then(traverse2)
            .then(map(([trip, locations]): TripState | null => {
                if (trip) {
                    return {
                        type: 'trip-state-with-saved-origin',
                        id: trip.trip_id,
                        origin: {
                            id: trip.origin_id,
                            name: trip.origin
                        },
                        locations
                    }
                } else if (locations.length > 0) {
                    return {
                        type: 'trip-state-without-origin',
                        locations
                    }
                } else {
                    return null
                }
            }))
    }
}

const createTripWithoutOrigin = <T extends TripState>(locations: SavedLocation[]) => {
    const trip: TripStateWithoutOrigin = {
        type: 'trip-state-without-origin',
        locations,
    }
    return asyncSuccess(trip as ConditionalTripState<T>)
}

const createTripWithSavedOrigin = <T extends TripState>(database: DatabaseAccess, origin: string, locations: SavedLocation[]): AsyncResult<ConditionalTripState<T>> =>
    successIfDefined(locations.find(location => location.name == origin))
        .flatMapAsync(insertTrip(database, locations))
        .then(map((trip) => trip as ConditionalTripState<T>))

const insertTrip = (database: DatabaseAccess, savedLocations: SavedLocation[]) => (origin: SavedLocation) => {
    return database
        .runAsync('INSERT INTO trips (origin) VALUES (?)', [origin.id])
        .then(map(createTrip(origin, savedLocations)));
}

const createTrip = (origin: SavedLocation, locations: SavedLocation[]) => ({lastInsertId}: RunResult): TripStateWithSavedOrigin =>
    ({
        id: lastInsertId,
        origin,
        type: 'trip-state-with-saved-origin',
        locations
    })


type ProcessLocations = (database: DatabaseAccess, locations: Location[]) => AsyncResult<SavedLocation[]>

const processLocations: ProcessLocations = (database, locations) => {
    return createInsertStatement(database)
        .then(flatMapAsync(({execute, finalize}) =>
            Promise
                .all(locations.map(insertLocation(execute)))
                .finally(finalize)
                .then(traverse)));
}

const insertLocation = (execute: Statement['executeAsync']) => (location: Location): AsyncResult<SavedLocation> =>
    locationIsSaved(location) ? asyncSuccess(location) : execute([location]).then(map(createSavedLocation(location)))

const createInsertStatement = (database: DatabaseAccess) =>
    database.prepareAsync('INSERT INTO locations (name) VALUES (?)')
        .then(map((statement) => ({
            execute: statement.executeAsync,
            finalize: statement.finalizeAsync
        })))

export const locationIsSaved = (location: Location): location is SavedLocation => typeof location == 'object'

type CreateSavedLocation = (name: string) => (result: RunResult) => SavedLocation
const createSavedLocation: CreateSavedLocation = (name) =>
    ({lastInsertId}) => ({id: lastInsertId, name})

type RawTripSummary = {
    id: number,
    origin: string
}

const tripMapper = createSimpleTypeSafeMapper<RawTripSummary>({
    id: 'number',
    origin: 'string'
})

const allTripsStatement = (database: DatabaseAccess) =>
    database.prepareAsync(`
        SELECT trips.id as id, locations.name as origin
        FROM trips
                 LEFT JOIN locations ON trips.origin = locations.id
    `)

export const getAll = ({getAllAsync, finalizeAsync}: Statement) => getAllAsync([]).finally(finalizeAsync)
export const getOne = ({getFirstAsync, finalizeAsync}: Statement) => getFirstAsync([]).finally(finalizeAsync)

const rawTripSummaryToTripStateSummary = (trip: RawTripSummary): TripStateSummary =>
    ({...trip, startTime: new Date().getTime()})
