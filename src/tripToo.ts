import {Result} from "./results";

export type Trip = OriginSelector
    | PendingTrip
    | MovingTrip
    | StoppedTrip
    | StoplightTrip
    | DestinationSelector
    | RouteSelector
    | AtDestinationTrip
    | CompleteTrip

interface WithInnerTrip {
    innerTrip: () => InnerTrip
}

export type NextTripWithCommit<T extends Trip> = {
    commit: () => Result<string, null>,
    nextTrip: T
}

export type OriginSelector = {
    type: "origin-selection"
    selectOrigin: (name: string) => TripActionResult<PendingTrip>
    locations: () => Array<string>
} & WithInnerTrip

export type PendingTrip = {
    type: "pending"
    start: () => TripActionResult<MovingTrip>
} & WithInnerTrip

export type TripActionResult<T extends Trip> = Result<string, NextTripWithCommit<T>>

export type MovingTrip = {
    type: "moving"
    stoplight: () => TripActionResult<StoplightTrip>
    train: () => TripActionResult<StoppedTrip>
    destination: () => TripActionResult<DestinationSelector>
} & WithInnerTrip

export type StoppedTrip = {
    type: "stopped",
} & TripWithGo

export type TripWithGo = {
    go: () => TripActionResult<MovingTrip>
} & WithInnerTrip

export type StoplightTrip = {
    type: "stoplight",
    train: () => TripActionResult<StoppedTrip>
} & TripWithGo

export type DestinationSelector = {
    type: "destination-selection"
    selectDestination: (name: string) => TripActionResult<RouteSelector>,
    locations: () => Array<string>
} & WithInnerTrip

export type RouteSelector = {
    type: "route-selection"
    selectRoute: (name: string) => TripActionResult<AtDestinationTrip>,
    routes: () => Array<string>
} & WithInnerTrip

export type AtDestinationTrip = {
    type: "at-destination",
    complete: () => TripActionResult<CompleteTrip>
} & TripWithGo

export type CompleteTrip = {
    type: "complete",
    summary: () => TripSummary
} & WithInnerTrip

type TripSummary = {
    startTime: number,
    duration: {
        total: number,
        atStoplight: number,
        atTrain: number,
        atDestinations: number,
        moving: number
    },
    count: {
        stoplights: number,
        trains: number,
        destinations: number
    }
}

export type EventState =
    LocationState
    | RouteState
    | 'pending'
    | 'moving'
    | 'stoplight'
    | 'train'
    | 'destination'
    | 'complete'

export type LocationState = {
    location: string,
    type: LocationType
}

export type RouteState = {
    route: string
}

export type LocationType = "origin" | "destination"

export type InnerTrip = {
    id: () => number,
    events: () => Array<Event>
    routes: (locations: LocationPair | null) => Array<Route>
    locations: () => Array<Location>
    lastEvent: () => Event | null
    lastLocations: () => LocationPair | null
    startTransaction: () => Result<string, TripTransaction>
}

export type TripTransaction = {
    addEvent: (state: EventState) => Result<string, null>
    unsavedLocations: () => Result<string, Array<Location>>
    unsavedRoutes: () => Result<string, Array<UnsavedRoute>>
    unsavedEvents: () => Result<string, Array<UnsavedEvent>>
    rollback: () => Result<string, null>
    commit: () => Result<string, null>
}

export type UnsavedRoute = {
    name: string,
    locationOneId: number,
    locationTwoId: number,
    setRouteId: (id: number) => void
}

export type UnsavedRouteName = {
    setRouteId: (id: number) => void
} & RouteInfo

export type UnsavedEvent = UnsavedSimpleEvent | UnsavedRouteEvent | UnsavedLocationEvent

export type UnsavedEventCore = {
    state: string
    order: number
    timestamp: number
    setEventId: (id: number) => void
}

export type UnsavedSimpleEvent = {
    type: 'simple'
} & UnsavedEventCore

export type UnsavedRouteEvent = {
    type: 'route'
    getEventId: () => Result<string, number>
    getRouteId: () => Result<string, number>
} & UnsavedEventCore

export type UnsavedLocationEvent = {
    type: 'location'
    getEventId: () => Result<string, number>
    getLocationId: () => Result<string, number>
} & UnsavedEventCore

export type InnerTripState = {
    id: number
    events: Array<Event>
    locations: Array<Location>
    routesToo?: RouteMap
}

export type RouteMap = { [key: string]: { [key: string]: Array<Route> } }

export type Location = {
    id: number | null
    name: string
}

export type Route = {
    id: number | null
    name: string
}

export type RouteInfo = {
    name: string
    locationOne: string
    locationTwo: string
}

export type LocationPair = {
    one: string
    two: string
}

export type Event = {
    id: number | null
    state: EventState,
    timestamp: number,
    order: number
}

export type TripRepository = {
    nextTrip: () => Promise<Result<string, Trip>>
    save: (trip: InnerTrip) => Promise<Result<string, null>>
}