import {Event, EventState, InnerTripState} from "../../tripTypes";
import {Result, success, toNull} from "../../utilities/results";
import {lastTwoLocations} from "./lastTwoLocations";
import {buildTripSummary} from "../innerTrip/buildTripSummary";
import * as events from "events";

type AddEvent = (nextState: InnerTripState, state: EventState) => Result<string, null>
export const addEvent: AddEvent = (nextState, state) => {
    const lastEvent = nextState.events[0];
    const lastSummaryEvent = nextState.events.find( it => typeof it.state == 'string' || !('route' in it.state) && it.state.type == 'origin')
    const nextEvent: Event = {
        id: null,
        state,
        timestamp: Date.now(),
        order: (lastEvent?.order || 0) + 1,
    };
    nextState.events.unshift(nextEvent)

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


    console.log(lastSummaryEvent)

    return buildTripSummary([nextEvent], lastSummaryEvent, nextState.summary)
        .doOnSuccess(summary => nextState.summary = summary)
        .doOnError(console.error)
        .map(toNull)
}
