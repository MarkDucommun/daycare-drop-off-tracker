import {AsyncResult} from "../utilities/results/results";

export type TripStateRepository = {
    save: <T extends TripState>(tripState: T) => AsyncResult<ConditionalTripState<T>>,
    summarizeAllTrips: () => AsyncResult<TripStateSummary[]>
}

export type TripStateSummary = {
    id: number,
    origin: string,
    startTime: number,
    endTime?: number
}

export type TripState = TripStateWithoutOrigin | TripStateWithOrigin | TripStateWithSavedOrigin

export type TripSaveMap = {
    'trip-state-without-origin': TripStateWithoutOrigin
    'trip-state-with-origin': TripStateWithSavedOrigin
    'trip-state-with-saved-origin': TripStateWithSavedOrigin
}

interface TripStateType {
    type: keyof TripSaveMap
}

export type ConditionalTripState<T extends TripState> = T extends TripStateWithoutOrigin ? TripStateWithoutOrigin :
    T extends TripStateWithOrigin ? TripStateWithSavedOrigin :
        T extends TripStateWithSavedOrigin ? TripStateWithSavedOrigin : never

export interface TripStateWithoutOrigin extends TripStateType {
    type: 'trip-state-without-origin'
    locations: Location[]
}

export interface TripStateWithOrigin extends TripStateType {
    type: 'trip-state-with-origin'
    origin: string
    locations: Location[]
}

export interface TripStateWithSavedOrigin extends TripStateType {
    type: 'trip-state-with-saved-origin'
    id: number
    origin: SavedLocation
    locations: Location[]
}

export type Location = string | SavedLocation

export type SavedLocation = {
    id: number
    name: string
}
