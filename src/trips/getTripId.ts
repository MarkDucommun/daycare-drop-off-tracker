import {extractRowsDataForType} from "../utilities/rowMapper";
import {ExecuteSQL} from "../utilities/databaseAccess";
import {Logger} from "../utilities/logger";
import {
    doOnError,
    failure,
    flatMap,
    flatMapErrorAsync,
    map,
    Result,
    success,
    successIfDefined
} from "../utilities/results";
import {ResultSet} from "expo-sqlite";
import {SaveTrip} from "./save";

type TripIdAndState = {
    trip_id: number
    state: string
}

const tripIdAndStateExtractor = extractRowsDataForType<TripIdAndState, keyof TripIdAndState>(
    {key: 'trip_id', type: 'number', nullable: false},
    {key: 'state', type: 'string', nullable: false}
);
export const getTripWithMostRecentEvent = (execute: ExecuteSQL, logger: Logger, insertTrip: SaveTrip): Promise<Result<string, number>> =>
    execute("select trip_id, state from events order by timestamp desc limit 1")
        .then(flatMap(extractSingleRecentTrip(logger)))
        .then(flatMap(failIfTripIsComplete))
        .then(doOnError(logger.error))
        .then(flatMapErrorAsync(insertTrip))
export const getMostRecentCompletedTrip = (execute: ExecuteSQL, logger: Logger): Promise<Result<string, number>> =>
    execute("SELECT trip_id, state FROM events WHERE state = 'complete' ORDER BY timestamp DESC LIMIT 1")
        .then(flatMap(extractSingleRecentTrip((logger))))
        .then(map(trip => trip.trip_id))

const extractSingleRecentTrip = (logger: Logger) => (resultSet: ResultSet): Result<string, TripIdAndState> =>
    tripIdAndStateExtractor(logger)(resultSet)
        .flatMap(trips => successIfDefined(trips[0]))
        .mapError(_ => "Failed to find a matching trip")

const failIfTripIsComplete = ({trip_id, state}: TripIdAndState): Result<string, number> =>
    state == "complete" ? failure("Most recent trip is complete") : success(trip_id)
