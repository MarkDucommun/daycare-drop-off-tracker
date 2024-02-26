import * as SQLite from "expo-sqlite";
import {NextTripWithCommit, Trip, TripActionResult, TripRepository} from "./tripTypes";
import React, {useEffect, useState} from "react";
import {doOnError, doOnSuccess, flatMap, Result} from "./utilities/results";
import {Button, StyleSheet, Text, View} from "react-native";
import {StatusBar} from "expo-status-bar";
import {Selector} from "./Selector";
import {ItemValue} from "@react-native-picker/picker/typings/Picker";
import {buildDbTripRepository} from "./trips/persistence/tripRepository";
import {createLogger} from "./utilities/logger";

export const DbTripRunner = () => {

    const db = SQLite.openDatabase("tripManager.db");

    const [repository, setRepository] = useState<TripRepository>()

    useEffect(() => {
        if (!repository) {
            buildDbTripRepository(db)()
                .then(doOnSuccess(repo => setRepository(repo)))
        }
    }, []);

    if (!repository) return <></>

    return (<TripRunner repository={repository} />)
}

type TripRunnerProps = {
    repository: TripRepository
}

export const TripRunner: React.FC<TripRunnerProps> = ({repository}) => {

    const logger = createLogger("tripRunner", "TRACE", "yellow")
    const [trip, setTrip] = useState<Trip | undefined>()
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (trip == undefined) {
            repository.nextTrip()
                .then(doOnSuccess(trip => setTrip(trip)))
                .then(doOnError(message => setErrorMessage(message)))
        }
    });

    if (errorMessage != null) {
        return (<View style={styles.container}>
            <Text>Error: {errorMessage}</Text>
            <StatusBar style="auto"/>
        </View>)
    }

    if (!trip) {
        return (<View style={styles.container}>
            <Text>Starting app...</Text>
            <StatusBar style="auto"/>
        </View>)
    }

    const commitAndSetTrip = ({commit, nextTrip}: NextTripWithCommit<Trip>): Promise<Result<string, null>> => {
        return repository.save(nextTrip.innerTrip())
            .then(doOnError(message => logger.info(message)))
            .then(flatMap(commit))
            .then(doOnSuccess(_ => setTrip(nextTrip)))
    }

    const executeTripAction = <T extends Trip>(fn: () => TripActionResult<T>) => () => fn().flatMapAsync(commitAndSetTrip).then()

    const executeTripActionWithArg = <T extends Trip>(fn: (arg: string) => TripActionResult<T>) =>
        (arg: ItemValue) => {
            if (typeof arg == 'string') {
                logger.info("CLICK")
                return fn(arg).flatMapAsync(commitAndSetTrip).then()
            }
        }

    switch (trip.type) {
        case "origin-selection":
            return (<>
                <Selector onConfirmSelection={executeTripActionWithArg(trip.selectOrigin)}
                          values={trip.locations()} selectButtonText={"Select Origin"}
                          enterNewButtonText={"Enter new location"} placeholderText={"New location..."}/>
            </>)
        case "pending":
            return (<>
                <Button title={"Start"} onPress={executeTripAction(trip.start)}/>
            </>)
        case "moving":
            return (<>
                <Button title={"Stoplight"} onPress={executeTripAction(trip.stoplight)}/>
                <Button title={"Train"} onPress={executeTripAction(trip.train)}/>
                <Button title={"Destination"} onPress={executeTripAction(trip.destination)}/>
            </>)
        case "stopped":
            return (<>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
            </>)
        case "stoplight":
            return (<>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
                <Button title={"Train"} onPress={executeTripAction(trip.train)}/>
            </>)
        case "destination-selection":
            return (<>
                <Selector onConfirmSelection={executeTripActionWithArg(trip.selectDestination)}
                          values={trip.locations()} selectButtonText={"Select Destination"}
                          enterNewButtonText={"Enter new location"} placeholderText={"New location..."}/>
            </>)
        case "route-selection":
            return (<>
                <Selector onConfirmSelection={executeTripActionWithArg(trip.selectRoute)}
                          values={trip.routes()} selectButtonText={"Select Route"}
                          enterNewButtonText={"Enter new route"} placeholderText={"New route..."}/>
            </>)
        case "at-destination":
            return (<>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
                <Button title={"Complete"} onPress={executeTripAction(trip.complete)}/>
            </>)
        case "complete":
            return (<>
                <Button title={"New Trip"} onPress={() => {
                    repository.nextTrip()
                        .then(doOnSuccess(trip => setTrip(trip)))
                        .then(doOnError(message => setErrorMessage(message)))
                }}/>
            </>)
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
    pickerStyles: {
        width: '70%',
        color: 'black'
    }
});
