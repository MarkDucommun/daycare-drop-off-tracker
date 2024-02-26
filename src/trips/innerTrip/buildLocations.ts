import {Result, success} from "../../utilities/results";
import {Location} from "../../tripTypes";
import {Logger} from "../../utilities/logger";

type BuildLocations = (locations: Array<LocationData>, logger: Logger) => Result<string, Array<Location>>

export const buildLocations: BuildLocations = (locations) =>
    success(locations.map(({id, name}) => ({id, name}) as Location))
