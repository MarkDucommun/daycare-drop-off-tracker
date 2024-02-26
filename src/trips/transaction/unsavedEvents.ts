import {
    FlattenedRoute,
    InnerTripState,
    LocationEvent,
    RouteEvent,
    RouteMap,
    SimpleEvent,
    UnsavedEvent
} from "../../tripTypes";
import {Result, successIfDefined} from "../../utilities/results";
import {flattenRouteMap, locationId} from "../innerTrip/innerTripStateUtilities";

type UnsavedEvents = (nextState: InnerTripState) => Array<UnsavedEvent>

const unsavedSimpleEvent = (event: SimpleEvent): UnsavedEvent => ({
    type: 'simple',
    state: event.state,
    order: event.order,
    timestamp: event.timestamp,
    setEventId: (id) => event.id = id
})

const unsavedLocationEvent = (nextState: InnerTripState, event: LocationEvent): UnsavedEvent => ({
    type: 'location',
    state: `${event.state.type}-selection`,
    order: event.order,
    timestamp: event.timestamp,
    setEventId: (id) => event.id = id,
    getEventId: () => successIfDefined(event.id),
    getLocationId: () => locationId(nextState, event.state.location)
})

const findRouteByName = (routeMap: RouteMap, name: string): Result<string, FlattenedRoute> =>
    successIfDefined(flattenRouteMap(routeMap).find(({route}) => route.name == name))

const unsavedRouteEvent = (nextState: InnerTripState, event: RouteEvent): UnsavedEvent => ({
    type: 'route',
    state: 'route-selection',
    order: event.order,
    timestamp: event.timestamp,
    setEventId: (id) => event.id = id,
    getEventId: () => successIfDefined(event.id),
    getRouteId: () => findRouteByName(nextState.routes, event.state.route)
        .mapError(_ => "No route found with that name")
        .flatMap(({route}) => successIfDefined(route.id))
        .mapError(_ => "Route has not been saved")
})

export const unsavedEvents: UnsavedEvents = (nextState) =>
    nextState.events.filter(({id}) => !id)
        .map(event => {
            if (typeof event.state == "string") {
                return unsavedSimpleEvent(event)
            } else if (typeof 'object' && 'location' in event.state) {
                return unsavedLocationEvent(nextState, event as LocationEvent)
            } else {
                return unsavedRouteEvent(nextState, event as RouteEvent)
            }
        })
