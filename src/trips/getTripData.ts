import {Logger} from "../utilities/logger";
import {flatMapAsync, map, Result, success} from "../utilities/results";
import {getLocations} from "./getLocations";
import {addAllEventDataToAllData, getEvents} from "./getEvents";
import {ExecuteSQL} from "../utilities/databaseAccess";
import {getRoutes} from "./getRoutes";

type GetTripData = (executor: ExecuteSQL, logger: Logger) => (tripId: number) => Promise<Result<string, AllData>>
export const getTripData: GetTripData = (executor, logger: Logger) => (tripId) =>
    success<string, AllData>(buildEmptyAllData(tripId))
        .flatMapAsync((allData) =>
            getLocations(executor, logger).then(map(addToAllData(allData, 'locationsData'))))
        .then(flatMapAsync((allData) =>
            getRoutes(executor).then(map(addToAllData(allData, 'routesData')))))
        .then(flatMapAsync((allData) =>
            getEvents(executor)(tripId).then(map(addAllEventDataToAllData(allData)))))

const buildEmptyAllData = (tripId: number): AllData => ({
    tripData: {
        id: tripId
    },
    routesData: [],
    locationsData: [],
    eventsData: [],
    eventRoutesData: [],
    eventLocationsData: []
})

const addToAllData = <T extends keyof AllData, S extends AllData[T]>(allData: AllData, key: T) => (s: S): AllData => ({
    ...allData,
    [key]: s
})
