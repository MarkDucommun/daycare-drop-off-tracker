import {failure, Result, success, successIfDefined, traverse} from "../../utilities/results";
import {Event, LocationState, LocationType, RouteState} from "../../tripTypes";
import {locationName} from "./buildRoutes";

type BuildEvents = (allData: AllData) => Result<string, Array<Event>>
export const buildEvents: BuildEvents = (allData: AllData): Result<string, Array<Event>> =>
    traverse(allData.eventsData.map(buildEvent(allData)))
        .map(sortEvents)

const buildEvent = (
    {
        routesData: routes,
        locationsData: locations,
        eventsData: events,
        eventLocationsData: eventLocations,
        eventRoutesData: eventRoutes
    }: AllData) => ({id, state, timestamp, order}: EventData): Result<string, Event> => {
    switch (state) {
        case 'moving':
        case 'stoplight':
        case 'train':
        case 'destination':
        case 'complete':
            return success({
                id,
                state,
                timestamp,
                order
            } as Event)
        case 'route-selection':
            return eventRouteState(routes, eventRoutes, id)
                .map(routeState => ({
                    id,
                    state: routeState,
                    timestamp,
                    order
                }) as Event)
        case 'origin-selection':
            return eventLocationState(locations, eventLocations, id, 'origin')
                .map(locationState => ({
                    id,
                    state: locationState,
                    timestamp,
                    order
                } as Event))
        case 'destination-selection':
            return eventLocationState(locations, eventLocations, id, 'destination')
                .map(locationState => ({
                    id,
                    state: locationState,
                    timestamp,
                    order
                } as Event))
        default:
            return failure(`No matching state for ${state}`)
    }
}

const sortEvents = (events: Array<Event>) => events.sort((a, b) => b.order - a.order)


type EventRouteState = (routes: Array<RouteData>, eventRoutes: Array<EventRouteData>, eventId: number) => Result<string, RouteState>

const eventRouteState: EventRouteState = (routes, eventRoutes, eventId) =>
    successIfDefined(eventRoutes.find(({event_id}) => event_id == eventId))
        .flatMap(({route_id}) => successIfDefined(routes.find(({id}) => id == route_id)))
        .map(({name}) => ({route: name}))

type EventLocationState = (locations: Array<LocationData>, eventLocations: Array<EventLocationData>, eventId: number, type: LocationType) => Result<string, LocationState>

const eventLocationState: EventLocationState = (locations, eventLocations, eventId, type) =>
    successIfDefined(eventLocations.find(({event_id}) => event_id == eventId))
        .flatMap(({location_id}) => locationName(locations)(location_id))
        .map(location => ({location, type}))
