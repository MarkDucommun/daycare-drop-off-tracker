import {Event, EventState, InnerTripState} from "../../tripTypes";
import {Result, success} from "../../utilities/results";
import {lastTwoLocations} from "./lastTwoLocations";

type AddEvent = (nextState: InnerTripState, state: EventState) => Result<string, null>
export const addEvent: AddEvent = (nextState, state) => {
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
