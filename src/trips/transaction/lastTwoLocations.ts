import {Event, LocationPair, LocationState} from "../../tripTypes";
import {failure, Result, success} from "../../utilities/results";

export const lastTwoLocations = (events: Array<Event>): Result<string, LocationPair> => {
    const locations = events
        .filter(it => typeof it.state == "object" && 'location' in it.state)
        .map(it => it.state as LocationState)
        .slice(0, 2)

    if (locations.length != 2)
        return failure("Must select two selections before selecting a route")

    return success({one: locations[1].location, two: locations[0].location})
}
