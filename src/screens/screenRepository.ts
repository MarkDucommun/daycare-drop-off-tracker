import {isScreenName, ScreenData, ScreenName, ScreenNameWithVersion} from "./screenTypes";
import {AsyncResult, doOnError, doOnSuccess, flatMap, flatMapAsync, map, successIfTruthy} from "../utilities/results";
import {createLogger, Logger} from "../utilities/logger";
import {RawScreenRepository} from "./persistence/rawScreenRepository";

// TODO implement with async storage
export type ScreenRepository = {
    getCurrentScreenName: (defaultScreen: ScreenName) => AsyncResult<ScreenNameWithVersion>
    saveScreen: (screen: ScreenNameWithVersion) => AsyncResult<null>
}

export type BuildScreenRepository = (rawScreenRepository: RawScreenRepository, parentLogger?: Logger) => AsyncResult<ScreenRepository>

export const buildApatheticScreenRepository: BuildScreenRepository = (rawRepository: RawScreenRepository, parentLogger?: Logger) => {
    const logger = parentLogger?.createChild("screenRepo") ?? createLogger("screenRepo")

    return rawRepository.setup(logger).then(map(buildRepository(rawRepository, logger)))
}

const buildRepository = (rawRepository: RawScreenRepository, logger: Logger) =>
    () => ({
        getCurrentScreenName: getCurrentScreenName(rawRepository, logger),
        saveScreen: saveScreen(rawRepository, logger)
    })

type BuildCurrentScreenName = (rawRepository: RawScreenRepository, logger: Logger) =>
    (defaultScreen: ScreenName) => AsyncResult<ScreenNameWithVersion>

type BuildSaveScreen = (rawRepository: RawScreenRepository, logger: Logger) =>
    (screen: ScreenNameWithVersion) => AsyncResult<null>

const getCurrentScreenName: BuildCurrentScreenName = (rawRepository, logger) =>
    (defaultScreen) => {
        logger.debug("Getting current screen name")
        return rawRepository.getCurrentScreen(logger)
            .then(flatMap((result: ScreenData) => isScreenName(result, logger).recover({
                name: defaultScreen,
                version: result.version
            })))
            .then(doOnSuccess(screen => logger.debug("Got screen - " + JSON.stringify(screen))))

    }

const saveScreen: BuildSaveScreen = (rawRepository, logger) => (screen) => {
    logger.debug("Saving screen - " + screen.name)
    return rawRepository.saveScreenNameTransaction(logger)
        .then(doOnError(e => logger.error(e)))
        .then(flatMapAsync(({getScreenNameVersions, saveScreenName}) =>
            getScreenNameVersions()
                .then(flatMap(ensureCorrectVersion(screen)))
                .then(flatMapAsync(_ => saveScreenName(screen)))
                .then(map(_ => null))));
}


const ensureCorrectVersion = <T extends object & { version: number }>(currentScreen: T) => (dbScreen: ScreenData) =>
    successIfTruthy(dbScreen.version + 1 === currentScreen.version)
        .mapError(_ => `Screen version is out of sync, aborting update - DB dbScreen 
            is ${dbScreen.version + 1} and current dbScreen is ${currentScreen.version}`)


