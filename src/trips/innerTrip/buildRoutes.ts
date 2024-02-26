import {Result, success, successIfDefined, traverse} from "../../utilities/results";
import {RouteMap} from "../../tripTypes";

type BuildRoutes = (routes: Array<RouteData>, locations: Array<LocationData>) => Result<string, RouteMap>

export const buildRoutes: BuildRoutes = (routes, locations) => {
    return traverse(routes.map(buildRoute(locationName(locations))))
        .map(routes => routes.reduce<RouteMap>(routeReduce, {}))
}

const buildRoute = (locationFinder: LocationFinder) =>
    ({name, id, location_two_id, location_one_id}: RouteData): Result<string, RouteInternal> =>
        success<string, Partial<RouteInternal>>({})
            .flatMap(findLocationAndAppend(locationFinder, location_one_id, 'locationOneName'))
            .flatMap(findLocationAndAppend(locationFinder, location_two_id, 'locationTwoName'))
            .map(route => ({...route, name, id} as RouteInternal))

const findLocationAndAppend = (locationFinder: LocationFinder, locationId: number, key: keyof RouteInternal) => (route: Partial<RouteInternal>) =>
    locationFinder(locationId).map(locationName => ({[key]: locationName, ...route}))


type RouteInternal = {
    id: number
    name: string
    locationOneName: string
    locationTwoName: string
}

type RouteReduce = (previousValue: RouteMap, currentValue: RouteInternal, currentIndex: number, array: RouteInternal[]) => RouteMap

const routeReduce: RouteReduce = (previousValue, currentValue, currentIndex, array) => {
    const outerLocationMap = previousValue[currentValue.locationOneName] || {}
    const innerLocationArray = outerLocationMap[currentValue.locationTwoName] || []
    outerLocationMap[currentValue.locationTwoName] = [...innerLocationArray, {
        id: currentValue.id,
        name: currentValue.name
    }]
    previousValue[currentValue.locationOneName] = outerLocationMap
    return previousValue
}

type LocationFinder = (id: number) => Result<string, string>
type LocationFinderCreator = (locations: Array<LocationData>) => LocationFinder
export const locationName: LocationFinderCreator = (locations) => (id) =>
    successIfDefined(locations.find(it => it.id == id))
        .map(location => location.name)

