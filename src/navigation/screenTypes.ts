import {ReactElement} from "react";
import {Result, successIfTruthy} from "../utilities/results";
import {Logger} from "../utilities/logger";

export type MenuScreen = {
    type: "menu"
} & CoreScreen

export type TripRunnerScreen = {
    type: "trip-runner"
} & CoreScreen

export type DatabaseTestScreen = {
    type: "database-test"
} & CoreScreen

export type TripsSummaryScreen = {
    type: "trips-summary"
} & CoreScreen

export type CoreScreen = {
    version: number
    render: (nextScreen: (screen: Screeen) => void) => ReactElement
}

export type Screeen = MenuScreen |
    TripRunnerScreen |
    DatabaseTestScreen |
    TripsSummaryScreen

export type RootStackParams = {
    'menu': undefined
    'database-tests': undefined
    'acceleration-tests': undefined
    'acceleration-results': undefined
    'acceleration-lists': undefined
    'trip-runner': undefined
    'trip-summary': undefined
    'trip-list': undefined
    'carousel': undefined
    'file-explorer': undefined
}

export type ScreenName = keyof RootStackParams

export const screenNames: Set<string> = new Set([
    'menu',
    'database-tests',
    'trip-runner',
    'trip-summary',
    'trip-list',
    'acceleration-tests',
    'acceleration-results',
    'acceleration-lists',
    'carousel',
    'file-explorer'
])

export const isScreenName = ({name, version}: ScreenData, logger?: Logger): Result<string, ScreenNameWithVersion> =>
    successIfTruthy(screenNames.has(name))
        .doOnError(_ => logger?.debug(`Unknown screen name: ${name}`))
        .map(_ => ({name: name as ScreenName, version}))
        .doOnSuccess(_ => logger?.debug(`Screen name: ${name}`))

export type ScreenData = {
    name: string,
    version: number
}

export type ScreenNameWithVersion = {
    name: ScreenName,
    version: number
}
