import {createLogger, Logger} from "../../utilities/logger";
import {Result, success} from "../../utilities/results";
import {InnerTripState} from "../../tripTypes";
import {buildRoutes} from "./buildRoutes";
import {emptyTripSummary} from "./buildTripSummary";
import {buildLocations} from "./buildLocations";
import {buildEvents} from "./buildEvents";

type BuildInnerTripState = (lastTrip: AllData) => Result<string, InnerTripState>

export const buildInnerTripState: BuildInnerTripState = (allData, logger?: Logger) =>
    success<string, Partial<InnerTripState>>({})
        .flatMap(smashInto(() => buildLocations(allData.locationsData, logger ?? createLogger("buildInnerTripState")), 'locations'))
        .flatMap(smashInto(() => buildRoutes(allData.routesData, allData.locationsData), 'routes'))
        .flatMap(smashInto(() => buildEvents(allData), 'events'))
        .flatMap(smashInto(() => success(allData.tripData.id), 'id'))
        .map(innerTripState => {
            // TODO add trip summary

            return innerTripState
        })
        .map(it => it as InnerTripState)

type SmashIntoInnerTrip = <T extends keyof InnerTripState>(fn: () => Result<string, InnerTripState[T]>, key: T) =>
    (state: Partial<InnerTripState>) => Result<string, Partial<InnerTripState>>

const smashInto: SmashIntoInnerTrip = (fn, key) => (state) =>
    fn().map(value => ({...state, [key]: value}))

export const emptyInnerTripState = (tripId: number): InnerTripState =>
    ({
        locations: [],
        routes: {},
        events: [],
        id: tripId,
        summary: emptyTripSummary()
    })
