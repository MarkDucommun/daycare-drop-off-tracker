import {FlattenedRoute, InnerTripState, RouteMap} from "../../tripTypes";
import {failure, Result, successIfDefined} from "../../utilities/results";

type FlattenRouteMap = (routeMap: RouteMap) => Array<FlattenedRoute>
type HydrateRouteMap = (routes: Array<FlattenedRoute>) => RouteMap

export const flattenRouteMap: FlattenRouteMap = (routeMap) =>
    Object.keys(routeMap).flatMap(locationOne =>
        Object.keys(routeMap[locationOne]).flatMap(locationTwo =>
            routeMap[locationOne][locationTwo].map((route) => ({
                route,
                locations: {one: locationOne, two: locationTwo}
            }))))

const hydrateRouteMap: HydrateRouteMap = (routes) =>
    routes.reduce((acc, {route, locations: {one, two}}) => {
        acc[one] = acc[one] || {}
        acc[one][two] = acc[one][two] || []
        acc[one][two].push(route)
        return acc
    }, {} as RouteMap)

const deepCopyRouteMapWithReduce = (routeMap: RouteMap): RouteMap => hydrateRouteMap(flattenRouteMap(routeMap))

export const deepCopyInnerTripState = (state: InnerTripState): InnerTripState => ({
    id: state.id,
    locations: [...state.locations],
    routes: deepCopyRouteMapWithReduce(state.routes),
    events: [...state.events],
    summary: {...state.summary} // TODO deep copy
})

export const locationId = (state: InnerTripState, location: string): Result<string, number> =>
    state.locations
        .filter(it => it.name == location)
        .map(it => it.id)
        .flatMap(successIfDefined)
        .filter(it => it.type == 'success')[0]
    || failure("Could not find persisted location")
