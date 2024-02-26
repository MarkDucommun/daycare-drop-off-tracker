type TripData = {
    id: number
}

type EventData = {
    id: number
    trip_id: number
    state: string
    timestamp: number
    order: number
}

type LocationData = {
    id: number
    name: string
}

type RouteData = {
    id: number
    name: string
    location_one_id: number
    location_two_id: number
}

type EventLocationData = {
    event_id: number
    location_id: number
}

type EventRouteData = {
    event_id: number
    route_id: number
}

type AllData = {
    tripData: TripData
    eventsData: Array<EventData>
    eventLocationsData: Array<EventLocationData>
    eventRoutesData: Array<EventRouteData>
    locationsData: Array<LocationData>
    routesData: Array<RouteData>
}
