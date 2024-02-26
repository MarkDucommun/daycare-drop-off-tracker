import {CompleteTrip, InnerTrip, InnerTripState, Trip, TripSummary, TripTransaction} from "../tripTypes";
import {Result, successIfTruthy} from "../utilities/results";
import {startTripTransaction} from "./transaction";
import {createLogger} from "../utilities/logger";
import {buildCompleteTrip, buildNextTrip} from "./nextTrip/buildTrips";
import {buildInnerTripState} from "./innerTrip/buildInnerTripState";
import {lastTwoLocations} from "./transaction/lastTwoLocations";
import {routesForLocationPair} from "./nextTrip/routesForLocation";

type GetNextTrip = (lastTrip: AllData) => Result<string, Trip>
type GetCompleteTrip = (lastTrip: AllData) => Result<string, CompleteTrip>
type BuildInnerTrip = (innerTripState: InnerTripState) => InnerTrip

export const getNextTrip: GetNextTrip = (lastTrip) =>
    buildInnerTripState(lastTrip)
        .map(buildInnerTrip)
        .map(buildNextTrip)

export const getCompleteTrip: GetCompleteTrip = (trip) =>
    buildInnerTripState(trip)
        .map(buildInnerTrip)
        .map(buildCompleteTrip)


export const buildInnerTrip: BuildInnerTrip = (innerTripState): InnerTrip => {

    let currentState = innerTripState
    let lastState: InnerTripState | null = null
    let inTransaction: boolean = false
    let openTransaction: TripTransaction | null = null

    const logger = createLogger("buildInnerTrip")

    return ({
        id: () => currentState.id,
        events: () => currentState.events,
        routes: routesForLocationPair(currentState.routes),
        locations: () => currentState.locations,
        lastEvent: () => currentState.events.length == 0 ? null : currentState.events[0],
        lastLocations: () => lastTwoLocations(currentState.events).getOrNull(),
        summary: (): TripSummary => {

            return ({}) as unknown as TripSummary
        },
        startTransaction: () => {
            return openTransaction ?? startTripTransaction(
                currentState,
                (tripTransaction) => {
                    logger.info("Starting transaction")
                    inTransaction = true
                    openTransaction = tripTransaction
                },
                (nextState) =>
                    successIfTruthy(inTransaction)
                        .doOnSuccess(_ => {
                            lastState = currentState
                            currentState = nextState
                            inTransaction = false
                            openTransaction = null
                        })
                        .mapError(_ => "Not in a transaction")
                        .map(_ => null)
            )
        }
    })
}

