import {TripStateWithOrigin, TripStateWithoutOrigin, TripStateWithSavedOrigin} from "./TripStateRepositoryType";

export type TripWithoutOrigin = {
    type: 'withoutOrigin'
    selectOrigin: (name: string) => TripWithOrigin
    state: TripStateWithoutOrigin
}

export type TripWithOrigin = {
    type: 'pending'
    start: () => void
    state: TripStateWithOrigin | TripStateWithSavedOrigin
}

export type Trip = TripWithoutOrigin | TripWithOrigin
