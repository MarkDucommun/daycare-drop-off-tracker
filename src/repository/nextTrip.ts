import {
    AtDestinationTrip, CompleteTrip,
    DestinationSelector,
    Event, EventState,
    InnerTrip,
    InnerTripState,
    Location,
    LocationPair,
    LocationState,
    LocationType, MovingTrip, OriginSelector, PendingTrip,
    Route,
    RouteMap, RouteSelector,
    RouteState, StoplightTrip, StoppedTrip, Trip, TripActionResult,
    TripTransaction, UnsavedEvent, UnsavedLocationEvent,
    UnsavedRoute, UnsavedRouteEvent,
    UnsavedRouteName, UnsavedSimpleEvent
} from "../tripToo";
import {failure, Result, success, successIfDefined, todo, todoFn, traverse} from "../results";

type GetNextTrip = (lastTrip: AllData) => Result<string, Trip>
type BuildNextTrip = (innerTrip: InnerTrip) => Trip
type BuildInnerTrip = (innerTripState: InnerTripState) => InnerTrip
type BuildInnerTripState = (lastTrip: AllData) => Result<string, InnerTripState>
type BuildLocations = (locations: Array<LocationData>) => Result<string, Array<Location>>
type BuildRoutesToo = (routes: Array<RouteData>, locations: Array<LocationData>) => Result<string, RouteMap>
type BuildEvents = (
    routes: Array<RouteData>,
    locations: Array<LocationData>,
    events: Array<EventData>,
    eventLocations: Array<EventLocationData>,
    eventRoutes: Array<EventRouteData>
) => Result<string, Array<Event>>

export const getNextTrip: GetNextTrip = (lastTrip) =>
    buildInnerTripState(lastTrip)
        .map(buildInnerTrip)
        .map(buildNextTrip)

export const buildNextTrip: BuildNextTrip = (innerTrip): Trip => {
    const lastEvent = innerTrip.lastEvent();
    if (lastEvent == null) {
        return buildOriginSelector(innerTrip)
    } else if (typeof lastEvent.state == 'string') {
        throw Error("NOT IMPLEMENTED - string")
    } else if ('route' in lastEvent.state) {
        throw Error("NOT IMPLEMENTED - route")
    } else {
        throw Error("NOT IMPLEMENTED - location")
    }
}

const buildOriginSelector = (innerTrip: InnerTrip): OriginSelector => ({
    type: "origin-selection",
    innerTrip: () => innerTrip,
    selectOrigin: buildNextTripWithCommitNameState(
        innerTrip,
        buildPendingTrip,
        (name) => ({location: name, type: "origin"})
    ),
    locations: () => innerTrip.locations().map(({name}) => name)
})

const buildPendingTrip = (innerTrip: InnerTrip): PendingTrip => ({
    type: "pending",
    innerTrip: () => innerTrip,
    start: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving')
})

const buildMovingTrip = (innerTrip: InnerTrip): MovingTrip => ({
    type: "moving",
    innerTrip: () => innerTrip,
    stoplight: buildNextTripWithCommit(innerTrip, buildStoplightTrip, 'stoplight'),
    train: buildNextTripWithCommit(innerTrip, buildTrainTrip, 'train'),
    destination: buildNextTripWithCommit(innerTrip, buildDestinationSelectorTrip, 'destination')
})

type BuildNextTripWithCommit = <T extends Trip>(
    innerTrip: InnerTrip,
    buildNextTrip: (innerTrip: InnerTrip) => T,
    state: EventState
) => () => TripActionResult<T>

type BuildNextTripWithCommitWithName = <T extends Trip>(
    innerTrip: InnerTrip,
    buildNextTrip: (innerTrip: InnerTrip) => T,
    state: (name: string) => EventState
) => (name: string) => TripActionResult<T>

const buildNextTripWithCommit: BuildNextTripWithCommit = <T extends Trip>(innerTrip: InnerTrip, buildNextTrip: (innerTrip: InnerTrip) => T, state: EventState) => {
    return () => buildNextTripWithCommitNameState(innerTrip, buildNextTrip, () => state)("")
}

const buildNextTripWithCommitNameState: BuildNextTripWithCommitWithName = <T extends Trip>(innerTrip: InnerTrip, buildNextTrip: (innerTrip: InnerTrip) => T, state: (name: string) => EventState) => (name: string) => {
    return innerTrip
        .startTransaction()
        .flatMap(transaction =>
            transaction.addEvent(state(name))
                .map(_ => transaction.commit)
        )
        .map(commit => ({nextTrip: buildNextTrip(innerTrip), commit}))
}

const buildStoplightTrip = (innerTrip: InnerTrip): StoplightTrip => {
    return {
        type: "stoplight",
        innerTrip: () => innerTrip,
        go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
        train: buildNextTripWithCommit(innerTrip, buildTrainTrip, 'train'),
    }
}
const buildTrainTrip = (innerTrip: InnerTrip): StoppedTrip => {
    return {
        type: "stopped",
        innerTrip: () => innerTrip,
        go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
    }
}

const buildDestinationSelectorTrip = (innerTrip: InnerTrip): DestinationSelector => {
    return {
        type: "destination-selection",
        innerTrip: () => innerTrip,
        selectDestination: buildNextTripWithCommitNameState(
            innerTrip,
            buildRouteSelectorTrip,
            (name) => ({location: name, type: "destination"})
        ),
        locations: () => innerTrip.locations().map(({name}) => name)
    }
}

const buildRouteSelectorTrip = (innerTrip: InnerTrip): RouteSelector => {
    return {
        type: "route-selection",
        innerTrip: () => innerTrip,
        selectRoute: buildNextTripWithCommitNameState(
            innerTrip,
            buildAtDestinationTrip,
            (name) => ({route: name})
        ),
        routes: () => innerTrip.routes(innerTrip.lastLocations()).map(({name}) => name)
    }
}

const buildAtDestinationTrip = (innerTrip: InnerTrip): AtDestinationTrip => {
    return {
        type: "at-destination",
        innerTrip: () => innerTrip,
        go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
        complete: buildNextTripWithCommit(innerTrip, buildCompleteTrip, 'complete'),
    }
}

const buildCompleteTrip = (innerTrip: InnerTrip): CompleteTrip => {
    return {
        type: "complete",
        innerTrip: () => innerTrip,
        summary: () => { throw Error("BANG") }
    }
}

type StartTripTransaction = (
    currentState: InnerTripState,
    startTransaction: () => Result<string, null>,
    commitTransaction: (nextState: InnerTripState) => Result<string, null>
) => Result<string, TripTransaction>

const startTripTransaction: StartTripTransaction = (
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
                routesToo: {...currentState.routesToo}, // TODO fully copy everything except the Route objects
                events: [...currentState.events]
            }

            return {
                addEvent: (state) => checkIfCommitted().flatMap(_ => {
                    nextState.events.unshift({
                        id: null,
                        state,
                        timestamp: Date.now(),
                        order: (nextState.events[0]?.order || 0) + 1,
                    } as Event)
                    if (typeof state == "object") {
                        if ('route' in state) {
                            // look for the last two location events
                            const locations = nextState.events
                                .filter(it => typeof it.state == "object" && 'location' in it.state)
                                .map(it => it.state as LocationState)
                                .slice(0, 2)

                            if (locations.length != 2)
                                return failure("Must select two selections before selecting a route")

                            const locationOne = locations[1].location;
                            const locationTwo = locations[0].location;
                            const outerMap = nextState.routesToo!![locationOne] || {}
                            const innerArray = outerMap[locationTwo] || []
                            if (!innerArray.find(({name}) => name == state.route)) {
                                outerMap[locationTwo] = [...innerArray, {id: null, name: state.route}]
                                nextState.routesToo!![locationOne] = outerMap
                            }
                        } else if (!nextState.locations.find(({name}) => name == state.location)) {
                            nextState.locations.push({name: state.location, id: null})
                        }
                    }
                    return success(null)
                }),
                unsavedLocations: () => checkIfCommitted().map(_ => nextState.locations.filter(({id}) => id == null)),
                unsavedRoutes: () => checkIfCommitted().flatMap(_ => {
                    const map = unsavedRoutes(nextState.routesToo!!)
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
                                state: 'location',
                                order: event.order,
                                timestamp: event.timestamp,
                                setEventId: (id) => event.id = id,
                                getEventId: () => successIfDefined(event.id),
                                getLocationId: () => locationId(nextState, state.location)
                            };
                            return newVar
                        } else {
                            const state = event.state;
                            const newVar: UnsavedRouteEvent = {
                                type: 'route',
                                state: 'location',
                                order: event.order,
                                timestamp: event.timestamp,
                                setEventId: (id) => event.id = id,
                                getEventId: () => successIfDefined(event.id),
                                getRouteId: () => nextState.
                            };
                        }
                    });

                    return map
                }),
                rollback: () => checkIfCommitted().flatMap(todoFn("NO ROLLBACK")),
                commit: () => checkIfCommitted().flatMap(() => commitTransaction(nextState))
            };
        })
}

type UnsavedRoutes = (routeMap: RouteMap) => Array<UnsavedRouteName>

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

type RoutesForLocation = (routeMap: RouteMap, locationPair: LocationPair) => Array<Route>

const routesForLocation: RoutesForLocation = (routeMap, {one, two}) => {
    const locationOneMap = routeMap[one];
    if (locationOneMap == null) return []
    return locationOneMap[two] || [];
}


const locationId = (state: InnerTripState, location: string): Result<string, number> =>
    state.locations
        .filter(it => it.name == location)
        .map(it => it.id)
        .flatMap(successIfDefined)
        .filter(it => it.type == 'success')[0]
    || failure("Could not find persisted location")

export const buildInnerTrip: BuildInnerTrip = (innerTripState): InnerTrip => {

    let currentState = innerTripState
    let lastState: InnerTripState | null = null
    let inTransaction: boolean = false
    const checkIfTransactionOpen = (): Result<string, null> =>
        inTransaction ? failure("Transaction already open") : success(null)

    return ({
        id: () => currentState.id,
        events: () => currentState.events,
        routes: (locations) => {
            if (locations == null) return []
            return routesForLocation(currentState.routesToo!!, locations);
        },
        locations: () => currentState.locations,
        lastEvent: () => currentState.events.length == 0 ? null : currentState.events[0],
        lastLocations: () => {
            const locations = currentState.events
                .filter(it => typeof it.state == "object" && 'location' in it.state)
                .map(it => it.state as LocationState)
                .slice(0, 2)

            if (locations.length != 2)
                return null

            const locationOne = locations[1].location;
            const locationTwo = locations[0].location;
            return {one: locationOne, two: locationTwo}
        },
        startTransaction: () => startTripTransaction(
            currentState,
            () => checkIfTransactionOpen().map(() => {
                inTransaction = true
            }).map(_ => null),
            (nextState) => {
                if (!inTransaction) return failure("Not in a transaction")
                lastState = currentState
                currentState = nextState
                inTransaction = false

                return success(null)
            }
        )
    })
}

export const buildInnerTripState: BuildInnerTripState = (
    {
        tripData,
        locationsData,
        routesData,
        eventsData,
        eventLocationsData,
        eventRoutesData,
    }
) => {

    return buildLocations(locationsData)
        .map(locations => ({locations}))
        .flatMap(innerTrip =>
            buildRoutesToo(routesData, locationsData)
                .map(routesToo => ({...innerTrip, routesToo})))
        .flatMap(innerTrip =>
            buildEvents(routesData, locationsData, eventsData, eventLocationsData, eventRoutesData)
                .map(events => ({...innerTrip, events})))
        .map(innerTrip => ({...innerTrip, id: tripData.id}))
        .map(innerTrip => innerTrip as InnerTripState)
}

export const emptyInnerTripState = (tripId: number): InnerTripState => {
    return {
        locations: [],
        routesToo: {},
        events: [],
        id: tripId
    }
}

export const buildLocations: BuildLocations = (locations) => {
    return success(locations.map(({name}) => ({name}) as Location));
}

export const buildRoutesToo: BuildRoutesToo = (routes, locations) => {
    const locationNameFinder = locationName(locations)
    const routeResults = routes.map(({name, id, location_two_id, location_one_id}) => {
        return locationNameFinder(location_one_id)
            .map(locationOneName => ({locationOneName}))
            .flatMap(route => locationNameFinder(location_two_id).map(locationTwoName => ({
                ...route,
                locationTwoName
            })))
            .map(route => ({...route, name, id} as RouteInternal))
    })

    return traverse(routeResults)
        .map(routes => routes.reduce<RouteMap>(routeReduce, {}))
}

type RouteInternal = {
    id: number
    name: string
    locationOneName: string
    locationTwoName: string
}

type RouteReduce = (previousValue: RouteMap, currentValue: RouteInternal, currentIndex: number, array: RouteInternal[]) => RouteMap

const routeReduce: RouteReduce = (previousValue, currentValue, currentIndex, array) => {
    const outerLocationMap = previousValue[currentValue.locationOneName] || {}
    const innerLocationArray = outerLocationMap[currentValue.locationTwoName] || []
    outerLocationMap[currentValue.locationTwoName] = [...innerLocationArray, {
        id: currentValue.id,
        name: currentValue.name
    }]
    previousValue[currentValue.locationOneName] = outerLocationMap
    return previousValue
}
export const buildEvents: BuildEvents = (
    routes,
    locations,
    events,
    eventLocations,
    eventRoutes
) => {

    const eventResults = events.map(({id, state, timestamp, order}): Result<string, Event> => {
        switch (state) {
            case 'pending':
            case 'moving':
            case 'stoplight':
            case 'train':
            case 'at-destination':
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
                return failure("No matching state")
        }
    })

    return traverse(eventResults).map(events => {
        return events.sort((a, b) => b.order - a.order)
    })
}

const locationName = (locations: Array<LocationData>) => (id: number): Result<string, string> => {
    const name = locations.filter(it => it.id == id).map(it => it.name)[0];
    return successIfDefined(name)
}

type EventRouteState = (routes: Array<RouteData>, eventRoutes: Array<EventRouteData>, eventId: number) => Result<string, RouteState>

const eventRouteState: EventRouteState = (routes, eventRoutes, eventId) => {
    return successIfDefined(eventRoutes.find(({event_id}) => event_id == eventId))
        .flatMap(({route_id}) => successIfDefined(routes.find(({id}) => id == route_id)))
        .map(({name}) => ({route: name}))
}

type EventLocationState = (locations: Array<LocationData>, eventLocations: Array<EventLocationData>, eventId: number, type: LocationType) => Result<string, LocationState>

const eventLocationState: EventLocationState = (locations, eventLocations, eventId, type) => {
    return successIfDefined(eventLocations.find(({event_id}) => event_id == eventId))
        .flatMap(({location_id}) => locationName(locations)(location_id))
        .map(location => ({location, type}))
}