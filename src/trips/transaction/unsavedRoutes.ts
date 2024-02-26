import {flattenRouteMap, locationId} from "../innerTrip/innerTripStateUtilities";
import {InnerTripState, RouteMap, UnsavedRoute, UnsavedRouteName} from "../../tripTypes";
import {Result, success} from "../../utilities/results";

type UnsavedRouteNames = (routeMap: RouteMap) => Array<UnsavedRouteName>
type UnsavedRoutes = (state: InnerTripState) => Array<Result<string, UnsavedRoute>>


const unsavedRoutesNames: UnsavedRouteNames = (routeMap) =>
    flattenRouteMap(routeMap)
        .filter(({route: {id}}) => id == null)
        .flatMap(({route, locations: {one: locationOne, two: locationTwo}}): UnsavedRouteName => ({
            setRouteId: (id) => route.id = id,
            name: route.name,
            locationOne,
            locationTwo
        }))

export const unsavedRoutes: UnsavedRoutes = (nextState) =>
    unsavedRoutesNames(nextState.routes)
        .map(({locationOne, locationTwo, name, setRouteId}) =>
            success<string, Partial<UnsavedRoute>>({name, setRouteId})
                .flatMap(route => locationId(nextState, locationOne).map(locationOneId => ({locationOneId, ...route})))
                .flatMap(route => locationId(nextState, locationTwo).map(locationTwoId => ({locationTwoId, ...route})))
                .map(it => it as UnsavedRoute))
