import {
    AtDestinationTrip, CompleteTrip,
    DestinationSelector,
    EventState,
    InnerTrip,
    MovingTrip,
    OriginSelector,
    PendingTrip, RouteSelector, StoplightTrip, StoppedTrip,
    Trip,
    TripActionResult,
    TripTransaction
} from "../../tripTypes";
import {success} from "../../utilities/results";
import {buildCompleteTripSummary} from "../innerTrip/buildTripSummary";

type BuildNextTrip = (innerTrip: InnerTrip) => Trip
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
    success<string, TripTransaction>(innerTrip.startTransaction())
        .flatMap(transaction =>
            transaction.addEvent(state(name))
                .map(_ => transaction.commit)
        )
        .map(commit => ({nextTrip: buildNextTrip(innerTrip), commit}))

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

export const buildCompleteTrip = (innerTrip: InnerTrip): CompleteTrip => ({
    type: "complete",
    innerTrip: () => innerTrip,
    summary: () => buildCompleteTripSummary(innerTrip.events())
})
