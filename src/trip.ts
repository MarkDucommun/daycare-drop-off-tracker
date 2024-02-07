import {Result} from "./results";

export type PendingTrip = {
    type: "pending"
    start: () => MovingTrip
} & CoreTrip

export type MovingTrip = {
    type: "moving"
    stoplight: () => StoppedTrip,
    train: () => StoppedTrip,
    dropOff: () => StoppedTrip,
    complete: () => OutboundTripSelector
} & ActiveTrip & CoreTrip

export type StoppedTrip = {
    type: "stopped"
    go: () => MovingTrip
} & ActiveTrip & CoreTrip

export type InboundTripSelector = {
    type: "inbound-selection"
    assignInboundRoute: (name: String) => CompletedTrip
}

export type OutboundTripSelector = {
    type: "outbound-selection"
    assignOutboundRoute: (name: String) => InboundTripSelector
}

export type CompletedTrip = {
    type: "completed",
    summarize: () => TripSummary
} & CoreTrip

type TripSummary = {
    startTime: number,
    duration: {
        total: number,
        atStoplight: number,
        atTrain: number,
        atDropOff: number,
        moving: number
    },
    count: {
        stoplights: number,
        trains: number,
    }
}

export type Trip = PendingTrip | MovingTrip | StoppedTrip | CompletedTrip

export type ActiveTrip = {
    startTimeMillis: {
        trip: number,
        currentSegment: number
    }
}

interface CoreTrip {
    innerTrip: () => InnerTrip
}

export type InnerTrip = {
    events: () => Array<TripEvent>,
    unsavedEvents: () => Array<TripEvent>
    addEvent: (state: TripState) => void,
    addId: (id: number) => void,
    id: null | number
}

export type PersistedInnerTrip = InnerTrip & {
    id: number
}

export type TripEvent = {
    state: TripState,
    timestamp: number,
    persisted: boolean
}

export type TripRepository = {
    nextTrip: () => Promise<Result<string, Trip>>
    save: (trip: InnerTrip) => Promise<Result<string, null>>
    getRoutes: () => Promise<Result<string, Array<string>>>
}

export type TripState = 'pending' | 'moving' | 'stoplight' | 'train' | 'drop-off' | 'complete'
