import {createLogger, createLoggerFromParent, Logger} from "../../utilities/logger";
import {Result, success} from "../../utilities/results";
import {InnerTripState} from "../../tripTypes";
import {buildRoutes} from "./buildRoutes";
import {buildTripSummary, emptyTripSummary} from "./buildTripSummary";
import {buildLocations} from "./buildLocations";
import {buildEvents} from "./buildEvents";

type BuildInnerTripState = (lastTrip: AllData) => Result<string, InnerTripState>

export const buildInnerTripState: BuildInnerTripState = (allData, parentLogger?: Logger) => {
        const logger = createLoggerFromParent(parentLogger)("buildInnerTripState")

        return success<string, Partial<InnerTripState>>({})
            .flatMap(smashInto(() => buildLocations(allData.locationsData, logger), 'locations'))
            .flatMap(smashInto(() => buildRoutes(allData.routesData, allData.locationsData), 'routes'))
            .flatMap(smashInto(() => buildEvents(allData), 'events'))
            .flatMap(smashInto(() => success(allData.tripData.id), 'id'))
            .flatMap(innerTripState => {
                    const sortedEvents = [...innerTripState.events!!].sort((a, b) => a.order - b.order);
                    return buildTripSummary(sortedEvents)
                        .doOnSuccess(summary => console.log(`Summary: ${JSON.stringify(summary)}`))
                        .map(summary => ({...innerTripState, summary}));
            })
            .map(it => it as InnerTripState);
}

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
