import {Result} from "./results";

type Trip = OriginSelector
    | PendingTrip
    | MovingTrip
    | StoppedTrip
    | StoplightTrip
    | DestinationSelector
    | RouteSelector
    | AtDestinationTrip
    | CompleteTrip

type OriginSelector = {
    type: "origin-selection"
    selectOrigin: (name: string) => PendingTrip,
    locations: () => Array<string>
}

type PendingTrip = {
    type: "pending"
    start: () => MovingTrip
}

type MovingTrip = {
    type: "moving"
    stoplight: () => StoplightTrip
    train: () => StoppedTrip
    destination: () => DestinationSelector
}

type StoppedTrip = {
    type: "stopped",
    go: () => void
}

type StoplightTrip = {
    type: "stoplight",
    train: () => StoppedTrip
} & StoppedTrip

type DestinationSelector = {
    type: "destination-selection"
    selectDestination: (name: string) => RouteSelector,
    locations: () => Array<string>
}

type RouteSelector = {
    type: "route-selection"
    selectRoute: (name: string) => AtDestinationTrip,
    routes: () => Array<string>
}

type AtDestinationTrip = {
    type: "at-destination",
    complete: () => CompleteTrip
} & StoppedTrip

type CompleteTrip = {
    type: "complete",
    summary: () => TripSummary
}

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
    routes: (locations: LocationPair) => Array<Route>
    locations: () => Array<Location>
    lastEvent: () => Event | null
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
    getEventId: () => number
    getRouteId: () => number
} & UnsavedEventCore

export type UnsavedLocationEvent = {
    type: 'location'
    getEventId: () => number
    getLocationId: () => number
} & UnsavedEventCore

export type InnerTripState = {
    id: number
    events: Array<Event>
    locations: Array<Location>
    routes: InnerRoutes
}

export type InnerRoutes = {
    forLocations: (locations: LocationPair) => Array<Route>
    unsaved: () => Array<UnsavedRouteName>
    add: (route: RouteInfo) => void
}

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

type TripRepository = {
    nextTrip: () => Promise<Result<string, Trip>>
    save: (trip: InnerTrip) => Promise<Result<string, null>>
}