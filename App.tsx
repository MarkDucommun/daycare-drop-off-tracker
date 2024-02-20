import {Button, StyleSheet, View} from 'react-native';
import React, {useEffect, useState} from "react";
import {TripRepository} from "./src/trip";
import {TripRunner} from "./src/TripRunner";
import {doOnError, doOnSuccess} from "./src/utilities/results";
import {buildFakeTripRepository} from "./src/repository/fakeTripRepository";
import {cleanDatabaseFile} from "./src/DatabaseIntegrationTest";
import {StatusBar} from "expo-status-bar";
import {createLogger} from "./src/utilities/logger";


export default function App() {

    const logger = createLogger("app", "INFO", "yellow")

    type Screens = "db_tests" | "trip_runner" | "trip_stats" | "menu"

    const [currentScreen, setCurrentScreen] = useState<Screens>("db_tests")

    // useEffect(() => {
    //     console.log("Running tests")
    //     cleanDatabaseFile().then(() => setErrorMessage("Opened database"))
    // }, []);

    // const [tripRepository, setTripRepository] = useState<TripRepository>()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    // useEffect(() => {
    //     buildFakeTripRepository()
    //         .then(doOnSuccess(repo => setTripRepository(repo)))
    //         .then(doOnError(error => setErrorMessage(error)))
    // }, []);


    // if (errorMessage != null) {
        return (<View style={styles.container}>
            {/*<Text>Error: {errorMessage}</Text>*/}
            <Button title={'Run tests'} onPress={() => cleanDatabaseFile()
                .then(doOnSuccess(() => logger.info("Ran Tests")))
                .then()}/>
            <StatusBar style="auto"/>
        </View>)
    // }
    //     return (<View style={styles.container}>
    //         <Button title={'Run tests'} onPress={cleanDatabaseFile}/>
    //     </View>)
    // }

    // if (tripRepository) {
    //     return <TripRunner repository={tripRepository}/>
    // }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

