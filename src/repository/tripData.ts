// trip (id)
// trip_event (id, trip_id, trip_state, order, timestamp)
// location (id, name unique)
// route (id, location_one_id, location_two_id, name unique) index location_one_id, location_two_id
// trip_event_location (id, trip_event_id, location_id))
// trip_event_route (id, trip_event_id, route_id)

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
    id: number
    event_id: number
    location_id: number
}

type EventRouteData = {
    id: number
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