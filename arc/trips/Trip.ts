import {
    TripState,
    TripStateWithOrigin,
    TripStateWithoutOrigin,
    TripStateWithSavedOrigin
} from "./TripStateRepositoryType";

export type TripWithoutOrigin = {
    type: 'withoutOrigin'
    selectOrigin: (name: string) => TripWithOrigin
    state: TripStateWithoutOrigin
}

export type TripWithOrigin = {
    type: 'pending'
    start: () => void
    cancel: () => void
    state: TripStateWithOrigin | TripStateWithSavedOrigin
}

export type CanceledTrip = {
    type: 'canceled'
    state: TripState
}

export type Trip = TripWithoutOrigin | TripWithOrigin
