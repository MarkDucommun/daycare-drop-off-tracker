import {
    AtDestinationTrip,
    CompleteTrip,
    DestinationSelector,
    Event,
    EventState,
    InnerTrip,
    InnerTripState,
    Location,
    LocationPair,
    LocationState,
    LocationType,
    MovingTrip,
    OriginSelector,
    PendingTrip,
    Route,
    RouteMap,
    RouteSelector,
    RouteState,
    StoplightTrip,
    StoppedTrip,
    Trip,
    TripActionResult
} from "../trip";
import {failure, Result, success, successIfDefined, successIfTruthy, traverse} from "../utilities/results";
import {lastTwoLocations, startTripTransaction} from "./tripTransaction";

type GetNextTrip = (lastTrip: AllData) => Result<string, Trip>
type BuildNextTrip = (innerTrip: InnerTrip) => Trip
type BuildInnerTrip = (innerTripState: InnerTripState) => InnerTrip
type BuildInnerTripState = (lastTrip: AllData) => Result<string, InnerTripState>
type BuildLocations = (locations: Array<LocationData>) => Result<string, Array<Location>>
type BuildRoutes = (routes: Array<RouteData>, locations: Array<LocationData>) => Result<string, RouteMap>
type BuildEvents = (
    allData: AllData
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
        switch (lastEvent.state) {
            case "moving":
                return buildMovingTrip(innerTrip)
            case "stoplight":
                return buildStoplightTrip(innerTrip)
            case "train":
                return buildTrainTrip(innerTrip)
            case "destination":
                return buildDestinationSelectorTrip(innerTrip)
            case "complete":
                return buildCompleteTrip(innerTrip)
        }
    } else if ('route' in lastEvent.state) {
        return buildAtDestinationTrip(innerTrip)
    } else if (lastEvent.state.type == 'origin') {
        return buildPendingTrip(innerTrip)
    } else {
        return buildRouteSelectorTrip(innerTrip)
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

const buildNextTripWithCommit: BuildNextTripWithCommit = <T extends Trip>(innerTrip: InnerTrip, buildNextTrip: (innerTrip: InnerTrip) => T, state: EventState) =>
    () => buildNextTripWithCommitNameState(innerTrip, buildNextTrip, () => state)("")

const buildNextTripWithCommitNameState: BuildNextTripWithCommitWithName = <T extends Trip>(innerTrip: InnerTrip, buildNextTrip: (innerTrip: InnerTrip) => T, state: (name: string) => EventState) => (name: string) =>
    innerTrip
        .startTransaction()
        .flatMap(transaction =>
            transaction.addEvent(state(name))
                .map(_ => transaction.commit)
        )
        .map(commit => ({nextTrip: buildNextTrip(innerTrip), commit}))

const buildStoplightTrip = (innerTrip: InnerTrip): StoplightTrip => ({
    type: "stoplight",
    innerTrip: () => innerTrip,
    go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
    train: buildNextTripWithCommit(innerTrip, buildTrainTrip, 'train'),
})

const buildTrainTrip = (innerTrip: InnerTrip): StoppedTrip => ({
    type: "stopped",
    innerTrip: () => innerTrip,
    go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
})

const buildDestinationSelectorTrip = (innerTrip: InnerTrip): DestinationSelector => ({
    type: "destination-selection",
    innerTrip: () => innerTrip,
    selectDestination: buildNextTripWithCommitNameState(
        innerTrip,
        buildRouteSelectorTrip,
        (name) => ({location: name, type: "destination"})
    ),
    locations: () => innerTrip.locations().map(({name}) => name)
})

const buildRouteSelectorTrip = (innerTrip: InnerTrip): RouteSelector => ({
    type: "route-selection",
    innerTrip: () => innerTrip,
    selectRoute: buildNextTripWithCommitNameState(
        innerTrip,
        buildAtDestinationTrip,
        (name) => ({route: name})
    ),
    routes: () => innerTrip.routes(innerTrip.lastLocations()).map(({name}) => name)
})

const buildAtDestinationTrip = (innerTrip: InnerTrip): AtDestinationTrip => ({
    type: "at-destination",
    innerTrip: () => innerTrip,
    go: buildNextTripWithCommit(innerTrip, buildMovingTrip, 'moving'),
    complete: buildNextTripWithCommit(innerTrip, buildCompleteTrip, 'complete'),
})

const buildCompleteTrip = (innerTrip: InnerTrip): CompleteTrip => ({
    type: "complete",
    innerTrip: () => innerTrip,
    summary: () => {
        throw Error("BANG")
    }
})

type RoutesForLocation = (routeMap: RouteMap, locationPair: LocationPair) => Array<Route>

const routesForLocation: RoutesForLocation = (routeMap, {one, two}) => {
    const locationOneMap = routeMap[one];
    if (locationOneMap == null) return []
    return locationOneMap[two] || [];
}

export const buildInnerTrip: BuildInnerTrip = (innerTripState): InnerTrip => {

    let currentState = innerTripState
    let lastState: InnerTripState | null = null
    let inTransaction: boolean = false
    const checkIfTransactionOpen = (): Result<string, null> =>
        inTransaction ? failure("Transaction already open") : success(null)

    return ({
        id: () => currentState.id,
        events: () => currentState.events,
        routes: (locations) =>
            successIfDefined(locations)
                .map(nonNullLocations => routesForLocation(currentState.routes, nonNullLocations))
                .getOrElse(() => []),
        locations: () => currentState.locations,
        lastEvent: () => currentState.events.length == 0 ? null : currentState.events[0],
        lastLocations: () => lastTwoLocations(currentState.events).getOrNull(),
        startTransaction: () => startTripTransaction(
            currentState,
            () => checkIfTransactionOpen().map(() => {
                inTransaction = true
            }).map(_ => null),
            (nextState) =>
                successIfTruthy(inTransaction)
                    .doOnSuccess(_ => {
                        lastState = currentState
                        currentState = nextState
                        inTransaction = false
                    })
                    .mapError(_ => "Not in a transaction")
                    .map(_ => null)
        )
    })
}

export const buildInnerTripState: BuildInnerTripState = (allData) =>
    success<string, Partial<InnerTripState>>({})
        .flatMap(smashInto(() => buildLocations(allData.locationsData), 'locations'))
        .flatMap(smashInto(() => buildRoutes(allData.routesData, allData.locationsData), 'routes'))
        .flatMap(smashInto(() => buildEvents(allData), 'events'))
        .flatMap(smashInto(() => success(allData.tripData.id), 'id'))
        .map(it => it as InnerTripState)

type SmashIntoInnerTrip = <T extends keyof InnerTripState>(fn: () => Result<string, InnerTripState[T]>, key: T) =>
    (state: Partial<InnerTripState>) => Result<string, Partial<InnerTripState>>

const smashInto: SmashIntoInnerTrip = (fn, key) => (state) =>
    fn().map(value => ({...state, [key]: value}))

export const emptyInnerTripState = (tripId: number): InnerTripState => ({
    locations: [],
    routes: {},
    events: [],
    id: tripId
})

export const buildLocations: BuildLocations = (locations) => {
    return success(locations.map(({name}) => ({name}) as Location));
}

const buildRoute = (locationFinder: LocationFinder) =>
    ({name, id, location_two_id, location_one_id}: RouteData): Result<string, RouteInternal> =>
        success<string, Partial<RouteInternal>>({})
            .flatMap(findLocationAndAppend(locationFinder, location_one_id, 'locationOneName'))
            .flatMap(findLocationAndAppend(locationFinder, location_two_id, 'locationTwoName'))
            .map(route => ({...route, name, id} as RouteInternal))

const findLocationAndAppend = (locationFinder: LocationFinder, locationId: number, key: keyof RouteInternal) => (route: Partial<RouteInternal>) =>
    locationFinder(locationId).map(locationName => ({[key]: locationName, ...route}))

export const buildRoutes: BuildRoutes = (routes, locations) => {
    return traverse(routes.map(buildRoute(locationName(locations))))
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

type LocationFinder = (id: number) => Result<string, string>
type LocationFinderCreator = (locations: Array<LocationData>) => LocationFinder
const locationName: LocationFinderCreator = (locations) => (id) =>
    successIfDefined(locations.find(it => it.id == id))
        .map(location => location.name)

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
