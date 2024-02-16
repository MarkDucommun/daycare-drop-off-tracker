import {NextTripWithCommit, Trip, TripActionResult, TripRepository} from "./tripToo";
import React, {useEffect, useState} from "react";
import {doOnError, doOnSuccess, map, Result} from "./results";
import {Button, StyleSheet, Text, View} from "react-native";
import {StatusBar} from "expo-status-bar";
import {Selector} from "./Selector";

type TripRunnerProps = {
    repository: TripRepository
}

export const TripRunner: React.FC<TripRunnerProps> = ({repository}) => {

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

    const commitAndSetTrip = ({commit, nextTrip}: NextTripWithCommit<Trip>): Result<string, null> =>
        commit().doOnSuccess(_ => setTrip(nextTrip))

    const executeTripAction = <T extends Trip>(fn: () => TripActionResult<T>) => () => fn().flatMap(commitAndSetTrip)

    switch (trip.type) {
        case "origin-selection":
            return (<View style={styles.container}>
                <Selector onConfirmSelection={(item) => {
                    if (typeof item == 'string') trip.selectOrigin(item).flatMap(commitAndSetTrip)
                }} values={trip.locations()} selectButtonText={"Select Origin"} enterNewButtonText={"Enter new location"} placeholderText={"New location..."}/>
            </View>)
        case "pending":
            return (<View style={styles.container}>
                <Button title={"Start"} onPress={executeTripAction(trip.start)}/>
            </View>)
        case "moving":
            return (<View style={styles.container}>
                <Button title={"Stoplight"} onPress={executeTripAction(trip.stoplight)}/>
                <Button title={"Train"} onPress={executeTripAction(trip.train)}/>
                <Button title={"Destination"} onPress={executeTripAction(trip.destination)}/>
            </View>)
        case "stopped":
            return (<View style={styles.container}>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
            </View>)
        case "stoplight":
            return (<View style={styles.container}>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
                <Button title={"Train"} onPress={executeTripAction(trip.train)}/>
            </View>)
        case "destination-selection":
            return (<View style={styles.container}>
                <Selector onConfirmSelection={(item) => {
                    if (typeof item == 'string') trip.selectDestination(item).flatMap(commitAndSetTrip)
                }} values={trip.locations()} selectButtonText={"Select Destination"} enterNewButtonText={"Enter new location"} placeholderText={"New location..."}/>
            </View>)
        case "route-selection":
            return (<View style={styles.container}>
                <Selector onConfirmSelection={(item) => {
                    if (typeof item == 'string') trip.selectRoute(item).flatMap(commitAndSetTrip)
                }} values={trip.routes()} selectButtonText={"Select Route"} enterNewButtonText={"Enter new route"} placeholderText={"New route..."}/>
            </View>)
        case "at-destination":
            return (<View style={styles.container}>
                <Button title={"Go"} onPress={executeTripAction(trip.go)}/>
                <Button title={"Complete"} onPress={executeTripAction(trip.complete)}/>
            </View>)
        case "complete":
            return (<View style={styles.container}>
                <Button title={"New Trip"} onPress={() => {
                    repository.nextTrip()
                        .then(doOnSuccess(trip => setTrip(trip)))
                        .then(doOnError(message => setErrorMessage(message)))
                }}/>
            </View>)
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