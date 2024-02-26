import {DatabaseTestScreen, MenuScreen, Screeen, TripRunnerScreen} from "./screenTypes";
import React from "react";
import {Button, Text} from "react-native";
import {cleanDatabaseFile} from "../DatabaseIntegrationTest";
import {doOnSuccess} from "../utilities/results";
import {createLogger} from "../utilities/logger";
import {DbTripRunner} from "../TripRunner";

export const buildMenuScreen = (currentVersion: number): MenuScreen => {
    const logger = createLogger("menu", "TRACE", "yellow")
    logger.info("Building menu screen")

    return {
        render(nextScreen: (screen: Screeen) => void): React.ReactElement {
            return (<>
                <Text>Menu</Text>
                <Button title={"Trip Runner"} onPress={() => {
                    logger.info("Trip Runner")
                    nextScreen(buildTripRunnerScreen(this.version + 1));
                }}/>
                <Button title={"Database Tests"}
                        onPress={() => nextScreen(buildDatabaseTestScreen(this.version + 1))}/>
            </>);
        },
        type: "menu",
        version: currentVersion
    }
}

export const buildTripRunnerScreen = (currentVersion: number): TripRunnerScreen => {

    const logger = createLogger("tripRunner", "TRACE", "yellow")
    logger.info("Building Trip Runner screen, version: " + currentVersion)

    return {
        render(nextScreen: (screen: Screeen) => void): React.ReactElement {

            return (<>
                <Text>Trip Runner</Text>
                <Button title={"Menu"} onPress={() => {
                    logger.info("CLICKED")
                    nextScreen(buildMenuScreen(this.version + 1));
                }}/>
                <DbTripRunner/>
            </>);
        },
        type: "tripRunner",
        version: currentVersion
    }
}


export const buildTripsSummaryScreen = (currentVersion: number): Screeen => {
    return {
        render(nextScreen: (screen: Screeen) => void): React.ReactElement {
            return (<>
                <Text>Trips Summary</Text>
                <Button title={"Menu"} onPress={() => nextScreen(buildMenuScreen(this.version + 1))}/>
            </>);
        },
        type: "tripsSummary",
        version: currentVersion
    }
}

export const buildDatabaseTestScreen = (currentVersion: number): DatabaseTestScreen => {
    const logger = createLogger("databaseTest", "TRACE", "yellow");

    return {
        render(nextScreen: (screen: Screeen) => void): React.ReactElement {
            return (<>
                <Text>Database Test</Text>
                <Button title={"Menu"} onPress={() => nextScreen(buildMenuScreen(this.version + 1))}/>
                <Button title={'Run tests'} onPress={() => cleanDatabaseFile()
                    .then(doOnSuccess(() => logger.info("Ran Tests")))
                    .then()}/>
            </>);
        },
        type: "databaseTest",
        version: currentVersion
    }
}
