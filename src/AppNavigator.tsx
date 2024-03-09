import {NavigationContainer} from "@react-navigation/native";
import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {AsyncResult, doOnError, doOnSuccess, loggerCurry} from "./utilities/results";
import {buildScreenRepository, ScreenRepository} from "./navigation/screenRepository";
import {createLogger, createLoggerFromParent, Logger} from "./utilities/logger";
import {ScreenName, ScreenNameWithVersion} from "./navigation/screenTypes";
import {ScreenNavigator} from "./navigation/ScreenNavigator";
import {LoggerProvider} from "./LoggerContext";
import {TripRepositoryProvider} from "./trips/persistence/TripRepositoryContext";
import {TripRepository} from "./tripTypes";
import {createTransactionCreatorForFile, TransactionCreator} from "./utilities/databaseAccess";
import {createRawTripRepository} from "./trips/persistence/rawTripRepository";
import {buildTripRepository} from "./trips/persistence/tripRepository";
import {createRawScreenRepositoryToo} from "./navigation/persistence/rawScreenRepository";
import {Loading} from "./navigation/Loading";
import {AccelerationRepository, buildAccelerationRepository} from "./acceleration/persistence/AccelerationRepository";
import {AccelerationRepositoryProvider} from "./acceleration/persistence/AccelerationRepositoryContext";

const createTripRepository = (parentLogger?: Logger) => {
    const logger = createLoggerFromParent(parentLogger)("db", "TRACE", "yellow")
    return createTransactionCreatorForFile("tripManager.db")
        .map(createRawTripRepository(logger))
        .flatMapAsync(loggerCurry(buildTripRepository)(logger));
}

const createScreenRepository = (parentLogger?: Logger) =>
    createTransactionCreatorForFile("screen-1.db")
        .map(createRawScreenRepositoryToo(parentLogger))
        .flatMapAsync(buildScreenRepository)

const createAccelerationRepository = (parentLogger?: Logger) =>
    createTransactionCreatorForFile("acceleration.db")
        .flatMapAsync(buildAccelerationRepository)

export const DatabaseManager: React.FC = () => {

    const logger = createLogger("app", "INFO", "yellow")

    const [screenRepository, setScreenRepository] = useState<ScreenRepository>()
    const [tripRepository, setTripRepository] = useState<TripRepository>()
    const [accelerationRepository, setAccelerationRepository] = useState<AccelerationRepository>()

    useEffect(() => {
        if (!screenRepository)
            createScreenRepository()
                .then(doOnSuccess(repo => setScreenRepository(repo)))
                .then(doOnError(e => logger.error(e)))
    })

    useEffect(() => {
        if (!tripRepository)
            createTripRepository()
                .then(doOnSuccess(repo => setTripRepository(repo)))
                .then(doOnError(e => logger.error(e)))
    }, []);

    useEffect(() => {
        if (!accelerationRepository)
            createAccelerationRepository()
                .then(doOnSuccess(repo => setAccelerationRepository(repo)))
                .then(doOnError(e => logger.error(e)))
    }, []);

    if (!screenRepository || !tripRepository || !accelerationRepository) return <Loading/>

    return <AppNavigator
        tripRepository={tripRepository}
        screenRepository={screenRepository}
        accelerationRepository={accelerationRepository}
        parentLogger={logger}
    />
}

export type TransactionCreators = {
    trip: TransactionCreator,
    screen: TransactionCreator
}

type AppNavigatorProps = {
    parentLogger?: Logger,
    tripRepository: TripRepository,
    screenRepository: ScreenRepository,
    accelerationRepository: AccelerationRepository
}

// LEVEL THAT IS TESTED
const AppNavigator: React.FC<AppNavigatorProps> = (
    {
        parentLogger,
        tripRepository,
        screenRepository,
        accelerationRepository
    }
) => {

    const logger = createLoggerFromParent(parentLogger)("app", "DEBUG", "yellow")
    const [initialScreen, setInitialScreen] = useState<ScreenName>()
    const [_, setScreenVersion] = useState<number>(0)
    const setScreen = ({name, version}: ScreenNameWithVersion) => {
        setInitialScreen(name);
        setScreenVersion(version);
    }

    useEffect(() => {
        if (!initialScreen) {
            screenRepository.getCurrentScreenName('menu')
                .then(doOnSuccess(setScreen))
                .then(doOnSuccess(_ => logger.info("Set screen")))
                .then(doOnError(e => logger.error(e)))
        }
    }, []);

    if (!initialScreen) return <Loading/>

    // TODO MAYBE MAKE AN ALL REPOSITORY PROVIDER
    return (
        <NavigationContainer>
            <LoggerProvider injectedLogger={logger}>
                <TripRepositoryProvider injectedRepository={tripRepository}>
                    <AccelerationRepositoryProvider injectedRepository={accelerationRepository}>
                        <ScreenNavigator
                            initialScreen={initialScreen}
                            logger={logger}
                            saveScreen={saveScreen(setScreenVersion, screenRepository.saveScreen)}
                        />
                    </AccelerationRepositoryProvider>
                </TripRepositoryProvider>
            </LoggerProvider>
        </NavigationContainer>
    );
};

const saveScreen = (
    setVersion: Dispatch<SetStateAction<number>>,
    save: (screen: ScreenNameWithVersion) => AsyncResult<null>
) => (screen: ScreenName) =>
    setVersion((prev) => {
        save({name: screen, version: prev + 1}).then(doOnError(() => setVersion(prev)))
        return prev + 1
    })

export default AppNavigator;
