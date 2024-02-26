import {ReactElement} from "react";
import {Result, successIfTruthy} from "../utilities/results";
import {Logger} from "../utilities/logger";

export type MenuScreen = {
    type: "menu"
} & CoreScreen

export type TripRunnerScreen = {
    type: "tripRunner"
} & CoreScreen

export type DatabaseTestScreen = {
    type: "databaseTest"
} & CoreScreen

export type TripsSummaryScreen = {
    type: "tripsSummary"
} & CoreScreen

export type CoreScreen = {
    version: number
    render: (nextScreen: (screen: Screeen) => void) => ReactElement
}

export type Screeen = MenuScreen | TripRunnerScreen | DatabaseTestScreen | TripsSummaryScreen

export type RootStackParams = {
    '1': undefined
    '2': undefined
    '3': undefined
    'menu': undefined
    'database-tests': undefined
    'trip-runner': undefined
}

export type ScreenName = keyof RootStackParams

export const screenNames: Set<string> = new Set([
    '1',
    '2',
    '3',
    'menu',
    'database-tests',
    'trip-runner',
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
