import {
    Event, EventState,
    InnerRoutes,
    InnerTrip,
    InnerTripState,
    Location,
    LocationPair, LocationState, LocationType, Route, RouteInfo, RouteState,
    TripTransaction,
    UnsavedRoute, UnsavedRouteName
} from "../tripToo";
import {failure, Result, success, successIfDefined, todo, todoFn, traverse} from "../results";
import {Trip} from "../trip";

type GetNextTrip = (lastTrip: AllData) => Result<string, Trip>
type BuildNextTrip = (innerTrip: InnerTrip) => Trip
type BuildInnerTrip = (innerTripState: InnerTripState) => InnerTrip
type BuildInnerTripState = (lastTrip: AllData) => Result<string, InnerTripState>
type BuildLocations = (locations: Array<LocationData>) => Result<string, Array<Location>>
type BuildRoutes = (routes: Array<RouteData>, locations: Array<LocationData>) => Result<string, InnerRoutes>
type BuildEvents = (
    routes: Array<RouteData>,
    locations: Array<LocationData>,
    events: Array<EventData>,
    eventLocations: Array<EventLocationData>,
    eventRoutes: Array<EventRouteData>
) => Result<string, Array<Event>>

const getNextTrip: GetNextTrip = (lastTrip) =>
    buildInnerTripState(lastTrip)
        .map(buildInnerTrip)
        .map(buildNextTrip)

const buildNextTrip: BuildNextTrip = (innerTrip): Trip => {

    if (innerTrip.lastEvent() == null) {
        throw Error("NOT IMPLEMENTED")
    } else {
        throw Error("NOT IMPLEMENTED")
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
                routes: {...currentState.routes},
                events: [...currentState.events]
            }

            return {
                addEvent: (state) => checkIfCommitted().flatMap(todoFn()),
                unsavedLocations: () => checkIfCommitted().map(() => nextState.locations.filter(({id}) => id == null)),
                unsavedRoutes: () => checkIfCommitted().flatMap(_ => {
                    const map = nextState.routes.unsaved()
                        .map(({locationOne, locationTwo, name, setRouteId}): Result<string, UnsavedRoute> => {
                            return locationId(nextState, locationOne)
                                .map(locationOneId => ({locationOneId}))
                                .flatMap(unsavedRoute => {
                                    return locationId(nextState, locationTwo)
                                        .map(locationTwoId => ({
                                            ...unsavedRoute,
                                            locationTwoId,
                                            name,
                                            setRouteId
                                        }))
                                })
                        });
                    return traverse(map)
                }),
                unsavedEvents: () => checkIfCommitted().flatMap(todoFn()),
                rollback: () => checkIfCommitted().flatMap(todoFn()),
                commit: () => checkIfCommitted().flatMap(() => commitTransaction(nextState))
            };
        })
}

const locationId = (state: InnerTripState, location: string): Result<string, number> =>
    state.locations
        .filter(it => it.name == location)
        .map(it => it.id)
        .flatMap(successIfDefined)
        .filter(it => it.type == 'success')[0]
    || failure("Could not find persisted location")


const buildInnerTrip: BuildInnerTrip = (innerTripState): InnerTrip => {

    let currentState = innerTripState
    let lastState: InnerTripState | null = null
    let inTransaction: boolean = false
    const checkIfTransactionOpen = (): Result<string, null> =>
        inTransaction ? failure("Transaction already open") : success(null)

    return ({
        id: () => currentState.id,
        events: () => currentState.events,
        routes: currentState.routes.forLocations,
        locations: () => currentState.locations,
        lastEvent: () => currentState.events.length == 0 ? null : currentState.events[0],
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

const buildInnerTripState: BuildInnerTripState = (
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
            buildRoutes(routesData, locationsData)
                .map(routes => ({...innerTrip, routes})))
        .flatMap(innerTrip =>
            buildEvents(routesData, locationsData, eventsData, eventLocationsData, eventRoutesData)
                .map(events => ({...innerTrip, events})))
        .map(innerTrip => ({...innerTrip, id: tripData.id}))
        .map(innerTrip => innerTrip as InnerTripState)
}

export const buildLocations: BuildLocations = (locations) => {
    return success(locations.map(({name}) => ({name}) as Location));
}

export const buildRoutes: BuildRoutes = (routes, locations) => {
    const locationNameFinder = locationName(locations)
    const routeResults = routes.map(({name, id, location_two_id, location_one_id}) => {
        return locationNameFinder(location_one_id)
            .map(locationOneName => ({locationOneName}))
            .flatMap(route => locationNameFinder(location_two_id).map(locationTwoName => ({...route, locationTwoName})))
            .map(route => ({...route, name, id} as RouteInternal))
    })

    return traverse(routeResults)
        .map(routes => routes.reduce<RouteMap>(routeReduce, {}))
        .map(routeMap => {
            const unsavedRouteMap: UnsavedRouteMap = {}

            return ({
                forLocations: ({one, two}) => {
                    const locationOneMap = routeMap[one];
                    if (locationOneMap == null) return []
                    return locationOneMap[two] || [];
                },
                unsaved: (): Array<UnsavedRouteName> => {
                    return Object.keys(unsavedRouteMap).flatMap(locationOne => {
                        return Object.keys(unsavedRouteMap[locationOne]).flatMap(locationTwo => {
                            return unsavedRouteMap[locationOne][locationTwo].flatMap((name): UnsavedRouteName => {
                                return {
                                    setRouteId: (id) => {
                                        unsavedRouteMap[locationOne][locationTwo] =
                                            unsavedRouteMap[locationOne][locationTwo]
                                                .filter(name => name != name)

                                        const outerMap = routeMap[locationOne] || {}
                                        const innerArray = outerMap[locationTwo] || []
                                        outerMap[locationTwo] = [...innerArray, {id, name}]
                                        routeMap[locationOne] = outerMap
                                    },
                                    name,
                                    locationOne,
                                    locationTwo
                                }
                            })
                        })
                    })
                },
                add: ({name, locationOne, locationTwo}: RouteInfo) => {
                    const outerMap = unsavedRouteMap[locationOne] || {}
                    const innerArray = outerMap[locationTwo] || []
                    outerMap[locationTwo] = [...innerArray, name]
                    unsavedRouteMap[locationOne] = outerMap
                }
            });
        })
}

type RouteInternal = {
    id: number
    name: string
    locationOneName: string
    locationTwoName: string
}

type RouteMap = { [key: string]: { [key: string]: Array<Route> } }

type UnsavedRouteMap = { [key: string]: { [key: string]: Array<string> } }

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

    const eventResults = events.map(({id, state, timestamp, order }): Result<string, Event> => {
        switch (state) {
            case 'pending':
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
                return eventRouteState(routes,eventRoutes,id)
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
        .map(location => ({ location, type }))
}