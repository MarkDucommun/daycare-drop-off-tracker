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

export type StoplightTrip = {
    type: "stoplight",
    train: () => TrainTrip
} & StoppedTrip

export type TrainTrip = {
    type: "train"
} & StoppedTrip

export type OriginSelector = {
    type: "origin-selection",
}

export type DestinationSelector = {
    type: "destination-selection"
}

export type LocationCreator = {
    type: "location-creator"
}

export type RouteSelector = {

}

export type StoppedTrip = {
    type: "stopped"
    go: () => MovingTrip
} & ActiveTrip & CoreTrip

export type InboundTripSelector = {
    type: "inbound-selection"
    assignInboundRoute: (name: string) => CompletedTrip
} & CoreTrip

export type OutboundTripSelector = {
    type: "outbound-selection"
    assignOutboundRoute: (name: string) => InboundTripSelector
} & CoreTrip

export type CompletedTrip = {
    type: "completed",
    summarize: () => TripSummary
} & CoreTrip

export type TripSummary = {
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
        dropOffs: number
    }
}

export type Trip = PendingTrip | MovingTrip | StoppedTrip | CompletedTrip | InboundTripSelector | OutboundTripSelector

export type ActiveTrip = {
    startTimeMillis: {
        trip: number,
        currentSegment: number
    }
}

interface CoreTrip {
    innerTrip: () => InnerTrip
}

type Revert = () => void

export type InnerTrip = {
    events: () => Array<TripEvent>,
    unsavedEvents: () => Array<TripEvent>
    addEvent: (state: TripState) => void,
    inboundRoute: string | null,
    outboundRoute: string | null,
    version: number,
    id: null | number,
    setId: (id: number) => Revert,
    incrementVersion: () => Revert
}

export type InnerTripToo = {
    events: () => Array<TripEvent>
    unsavedEvents: () => Array<TripEvent>
    addEvent: (state: TripState) => Revert
    addLeg: (leg: TripLeg) => Revert
    addId: (id: number) => Revert
    incrementVersion: () => Revert
}

export type InnerTripState = {
    id: number | null
    version: number
    events: Array<TripEvent>
    legs: Array<TripLeg>
}

export type TripLeg = {
    origin: string
    destination: string
    route: string
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
