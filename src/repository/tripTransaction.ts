import {failure, Result, success, successIfDefined, todoFn, traverse} from "../utilities/results";
import {
    Event,
    EventState,
    FlattenedRoute,
    InnerTripState,
    Location,
    LocationPair,
    LocationState,
    RouteMap,
    TripTransaction,
    UnsavedEvent,
    UnsavedLocationEvent,
    UnsavedRoute,
    UnsavedRouteName
} from "../trip";

export type StartTripTransaction = (
    currentState: InnerTripState,
    startTransaction: () => Result<string, null>,
    commitTransaction: (nextState: InnerTripState) => Result<string, null>
) => Result<string, TripTransaction>

type UnsavedRoutes = (routeMap: RouteMap) => Array<UnsavedRouteName>
type UnsavedEvents = (
    events: Array<Event>,
    routeMap: RouteMap,
    locations: Array<Location>
) => Array<UnsavedEvent>

type AddEvent = (nextState: InnerTripState, state: EventState) => Result<string, null>
const addEvent: AddEvent = (nextState, state) => {
    nextState.events.unshift({
        id: null,
        state,
        timestamp: Date.now(),
        order: (nextState.events[0]?.order || 0) + 1,
    } as Event)
    if (typeof state == "object") {
        if ('route' in state) {
            return lastTwoLocations(nextState.events).map(({one: locationOne, two: locationTwo}) => {
                const outerMap = nextState.routes[locationOne] || {}
                const innerArray = outerMap[locationTwo] || []
                if (!innerArray.find(({name}) => name == state.route)) {
                    outerMap[locationTwo] = [...innerArray, {id: null, name: state.route}]
                    nextState.routes[locationOne] = outerMap
                }
            }).map(_ => null)
        } else if (!nextState.locations.find(({name}) => name == state.location)) {
            nextState.locations.push({name: state.location, id: null})
        }
    }
    return success(null)
}

const unsavedRoutesToo: UnsavedRoutes = (routeMap) =>
    flattenRouteMap(routeMap)
        .filter(({route: {id}}) => id == null)
        .flatMap(({route, locations: {one: locationOne, two: locationTwo}}): UnsavedRouteName => ({
            setRouteId: (id) => route.id = id,
            name: route.name,
            locationOne,
            locationTwo
        }))

const unsavedRoutes: UnsavedRoutes = (routeMap) =>
    Object.keys(routeMap).flatMap(locationOne =>
        Object.keys(routeMap[locationOne]).flatMap(locationTwo =>
            routeMap[locationOne][locationTwo]
                .filter(({id}) => id == null)
                .flatMap((route): UnsavedRouteName => ({
                    setRouteId: (id) => route.id = id,
                    name: route.name,
                    locationOne,
                    locationTwo
                }))))

export const startTripTransaction: StartTripTransaction = (
    currentState, startTransaction, commitTransaction
) => {

    return startTransaction()
        .map(() => {
            let transactionCommitted: boolean = false
            const checkIfCommitted = (): Result<string, null> =>
                transactionCommitted ? failure("Transaction already committed") : success(null)

            const nextState: InnerTripState = {
                id: currentState.id,
                locations: [...currentState.locations],
                routes: {...currentState.routes}, // TODO fully copy everything except the Route objects
                events: [...currentState.events]
            }

            return {
                addEvent: (state) => checkIfCommitted().flatMap(_ => addEvent(nextState, state)),
                unsavedLocations: () => checkIfCommitted().map(_ => nextState.locations.filter(({id}) => id == null)),
                unsavedRoutes: () => checkIfCommitted().flatMap(_ => {
                    const map = unsavedRoutesToo(nextState.routes)
                        .map(({locationOne, locationTwo, name, setRouteId}) => {
                            return locationId(nextState, locationOne)
                                .map(locationOneId => ({locationOneId}))
                                .flatMap(unsavedRoute => {
                                    return locationId(nextState, locationTwo)
                                        .map(locationTwoId => ({
                                            ...unsavedRoute,
                                            locationTwoId,
                                            name,
                                            setRouteId
                                        }) as UnsavedRoute)
                                })
                        });
                    return traverse(map)
                }),
                unsavedEvents: () => checkIfCommitted().map(_ => {
                    const map: UnsavedEvent[] = nextState.events.filter(({id}) => !id).map(event => {
                        if (typeof event.state == "string") {
                            return {
                                type: 'simple',
                                state: event.state,
                                order: event.order,
                                timestamp: event.timestamp,
                                setEventId: (id) => event.id = id
                            }
                        } else if ('location' in event.state) {
                            const state = event.state;
                            const newVar: UnsavedLocationEvent = {
                                type: 'location',
                                state: `${state.type}-selection`,
                                order: event.order,
                                timestamp: event.timestamp,
                                setEventId: (id) => event.id = id,
                                getEventId: () => successIfDefined(event.id),
                                getLocationId: () => locationId(nextState, state.location)
                            }
                            return newVar
                        } else {
                            const state = event.state;

                            return {
                                type: 'route',
                                state: 'route-selection',
                                order: event.order,
                                timestamp: event.timestamp,
                                setEventId: (id) => event.id = id,
                                getEventId: () => successIfDefined(event.id),
                                getRouteId: () => findRouteByName(nextState.routes, state.route)
                                    .mapError(_ => "No route found with that name")
                                    .flatMap(({route}) => successIfDefined(route.id))
                                    .mapError(_ => "Route has not been saved")
                            }
                        }
                    });

                    return map
                }),
                rollback: () => checkIfCommitted().flatMap(todoFn("NO ROLLBACK")),
                commit: () => checkIfCommitted().flatMap(() => commitTransaction(nextState))
            };
        })
}

const findRouteByName = (routeMap: RouteMap, name: string): Result<string, FlattenedRoute> =>
    successIfDefined(flattenRouteMap(routeMap).find(({route}) => route.name == name))

type FlattenRouteMap = (routeMap: RouteMap) => Array<FlattenedRoute>
type HydrateRouteMap = (routes: Array<FlattenedRoute>) => RouteMap
const flattenRouteMap: FlattenRouteMap = (routeMap) =>
    Object.keys(routeMap).flatMap(locationOne =>
        Object.keys(routeMap[locationOne]).flatMap(locationTwo =>
            routeMap[locationOne][locationTwo].map((route) => ({
                route,
                locations: {one: locationOne, two: locationTwo}
            }))))

const hydrateRouteMap: HydrateRouteMap = (routes) =>
    routes.reduce((acc, {route, locations: {one, two}}) => {
        acc[one] = acc[one] || {}
        acc[one][two] = acc[one][two] || []
        acc[one][two].push(route)
        return acc
    }, {} as RouteMap)

const deepCopyRouteMapWithReduce = (routeMap: RouteMap): RouteMap => {
    return hydrateRouteMap(flattenRouteMap(routeMap))
}

const locationId = (state: InnerTripState, location: string): Result<string, number> =>
    state.locations
        .filter(it => it.name == location)
        .map(it => it.id)
        .flatMap(successIfDefined)
        .filter(it => it.type == 'success')[0]
    || failure("Could not find persisted location")

export const lastTwoLocations = (events: Array<Event>): Result<string, LocationPair> => {
    const locations = events
        .filter(it => typeof it.state == "object" && 'location' in it.state)
        .map(it => it.state as LocationState)
        .slice(0, 2)

    if (locations.length != 2)
        return failure("Must select two selections before selecting a route")

    return success({one: locations[1].location, two: locations[0].location})
}
