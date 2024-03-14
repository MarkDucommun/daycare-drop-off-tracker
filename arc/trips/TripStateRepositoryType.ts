import {AsyncResult} from "../utilities/results/results";

export type TripStateRepository = {
    allTrips: () => AsyncResult<TripStateSummary[]>
}

export type TripStateSummary = {
    id: number,
    origin: string,
    startTime: number,
    endTime?: number
}
