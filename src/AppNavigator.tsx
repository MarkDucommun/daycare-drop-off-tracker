import {NavigationContainer} from "@react-navigation/native";
import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {AsyncResult, doOnError, doOnSuccess, flatMapAsync} from "./utilities/results";
import {buildApatheticScreenRepository, ScreenRepository} from "./screens/screenRepository";
import {createLoggerFromParent, Logger} from "./utilities/logger";
import {ScreenName, ScreenNameWithVersion} from "./screens/screenTypes";
import {rawScreenRepository} from "./screens/persistence/sqliteRawScreenRepository";
import {Loading, ScreenNavigator} from "./screens/ScreenNavigator";
import {LoggerProvider} from "./LoggerContext";

type AppNavigatorProps = {
    parentLogger?: Logger
}

const AppNavigator: React.FC<AppNavigatorProps> = ({parentLogger}) => {

    const logger = createLoggerFromParent(parentLogger)("app", "INFO", "yellow")
    const [repository, setRepository] = useState<ScreenRepository>()
    const [initialScreen, setInitialScreen] = useState<ScreenName>()
    const [_, setScreenVersion] = useState<number>(0)
    const setScreen = ({name, version}: ScreenNameWithVersion) => {
        setInitialScreen(name);
        setScreenVersion(version);
    }

    useEffect(() => {
        if (!repository) {
            const rawScreenRepositoryInstance = rawScreenRepository(logger);

            buildApatheticScreenRepository(rawScreenRepositoryInstance, logger)
                .then(doOnSuccess(repo => setRepository(repo)))
                .then(flatMapAsync(repo => repo.getCurrentScreenName('menu')))
                .then(doOnSuccess(setScreen))
                .then(doOnSuccess(_ => logger.info("Set screen")))
        }
    }, []);

    if (!initialScreen || !repository) return <Loading/>

    return (
        <NavigationContainer>
            <LoggerProvider injectedLogger={logger}>
                <ScreenNavigator
                    initialScreen={initialScreen}
                    logger={logger}
                    saveScreen={saveScreen(setScreenVersion, repository.saveScreen)}
                />
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
