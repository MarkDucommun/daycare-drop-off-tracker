import {LocationPair, Route, RouteMap, RoutesForLocationPair} from "../../tripTypes";
import {successIfDefined} from "../../utilities/results";


type RoutesFromMapForLocation = (routeMap: RouteMap, locationPair: LocationPair) => Array<Route>

export const routesForLocationPair = (routes: RouteMap): RoutesForLocationPair => (locations) =>
    successIfDefined(locations)
        .map(nonNullLocations => routesForLocation(routes, nonNullLocations))
        .getOrElse(() => [])

export const routesForLocation: RoutesFromMapForLocation = (routeMap, {one, two}) => {
    const locationOneMap = routeMap[one];
    if (locationOneMap == null) return []
    return locationOneMap[two] || [];
}
