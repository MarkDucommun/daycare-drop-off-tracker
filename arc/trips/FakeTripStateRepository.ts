import {DatabaseAccess} from "../utilities/database/DatabaseTypes";
import {AsyncResult} from "../utilities/results/results";
import {map} from "../utilities/results/resultCurriers";
import {TripStateRepository, TripStateSummary} from "./TripStateRepositoryType";
import {success} from "../utilities/results/successAndFailure";

export const buildDatabaseTripStateRepository = async (database: DatabaseAccess): AsyncResult<TripStateRepository> =>
    migrate(database).then(map(constructRepository(database)))

async function migrate(database: DatabaseAccess): AsyncResult<null> {
    return success(null)
}

function constructRepository(database: DatabaseAccess): () => TripStateRepository {

    return () => ({
        allTrips: allTrips(database)
    })
}

function allTrips(database: DatabaseAccess): TripStateRepository['allTrips'] {
    return async () => {
        const trips: TripStateSummary[] = [
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
        ];
        return success(trips)
    }
}
