import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from "react";
import {Trip, TripRepository} from "./src/trip";
import {getTripRepository} from "./src/tripRepository";
import * as SQLite from "expo-sqlite";

function openDatabase() {
    const db = SQLite.openDatabase("daycare-dropoff.db");
    return db;
}

const db = openDatabase()

async function initializeTrip(
    tripRepository: TripRepository,
    trip: Trip | undefined,
    setTrip: (it: Trip) => void,
    setErrorMessage: (it: String) => void
) {
    if (trip == undefined) {
        const tripResults = await tripRepository.nextTrip();
        tripResults.map(setTrip).mapError(setErrorMessage)
    } else {
        console.log(trip)
    }
}

// async function dbTests(tripRepository: TripRepository, setErrorMessage: (it: String) => void) {
//     const tripResult = await tripRepository.nextTrip();
//
//     tripResult.mapError(setErrorMessage)
//
//     tripResult.map(async trip => {
//         if (trip.type == 'pending') {
//             const pendingTrip = trip
//
//             await tripRepository.save(pendingTrip.innerTrip())
//
//             const movingTrip = pendingTrip.start()
//
//             await tripRepository.save(movingTrip.innerTrip())
//
//             const completeTrip = movingTrip.complete();
//
//             await tripRepository.save(completeTrip.innerTrip())
//
//             const inner = completeTrip.innerTrip()
//
//             if ('id' in inner) {
//                 setErrorMessage("Inner trip ID: " + inner.id)
//             } else {
//                 setErrorMessage("Inner wasn't persisted")
//             }
//         }
//     })
//
// }

async function initializeRoutes(
    tripRepository: TripRepository,
    routes: Array<String>,
    setRoutes: (it: Array<String>) => void,
    setErrorMessage: (it: String) => void
) {
    if (routes.length == 0) {
        const routesResult = await tripRepository.getRoutes();
        routesResult.map(setRoutes).mapError(setErrorMessage)
    }
}


export default function App() {

    // TODO build a modal for overall summary of data
    // TODO build a list view that allows for inspecting each trip
    // TODO maybe an admin page for inspecting SQLite instance? Can we export SQLite instance to introspect it?

    const [tripRepository, setTripRepository] = useState<TripRepository>()
    const [trip, setTrip] = useState<Trip | undefined>()
    const [routes, setRoutes] = useState<Array<String>>([])
    const [errorMessage, setErrorMessage] = useState<String | null>(null)

    useEffect(() => {
        const tripRepository = getTripRepository(db);
        setTripRepository(tripRepository)
        // dbTests(tripRepository, setErrorMessage).then()
    }, []);

    useEffect(() => {
        if (tripRepository != undefined) {
            initializeTrip(tripRepository, trip, setTrip, setErrorMessage).then()
            initializeRoutes(tripRepository, routes, setRoutes, setErrorMessage).then()
        }
    }, [tripRepository]);

    if (errorMessage != null) {
        return (<View style={styles.container}>
            <Text>Error: {errorMessage}</Text>
            <StatusBar style="auto"/>
        </View>)
    }

    // if (routes.length == 0) {
    //     return (<View style={styles.container}>
    //         <Text>Starting app...</Text>
    //         <StatusBar style="auto"/>
    //     </View>)
    // } else {
    //
    //     return <View style={styles.container}>
    //         {routes.map((route, i) => <Text key={`route-${i}`}>{route.slice(1, route.length - 1)}</Text>)}
    //         <StatusBar style="auto"/>
    //     </View>
    // }

    if (!tripRepository || !trip) {
        return (<View style={styles.container}>
            <Text>Starting app...</Text>
            <StatusBar style="auto"/>
        </View>)
    }

    const updateTrip = (fn: () => Trip) => async () => {
        const nextTrip = fn()
        const result = await tripRepository.save(nextTrip.innerTrip())
        result.map(() => setTrip(nextTrip)).mapError(setErrorMessage)
    }

    // SHOW SEGMENT DURATION IF NOT PENDING OR COMPLETED
    // SHOW TOTAL DURATION IF NOT PENDING OR COMPLETED

    switch (trip.type) {
        case "pending":
            return (<View style={styles.container}>
                <Button title={"Load Trip"} onPress={() => {
                    tripRepository.nextTrip().then((result) => {
                        result.map(setTrip)
                    })
                }} />
                <Button title={"Start"} onPress={updateTrip(trip.start)}/>
            </View>)
        case "moving":
            return (<View style={styles.container}>
                <Button title={"Stoplight"} onPress={updateTrip(trip.stoplight)}/>
                <Button title={"Train"} onPress={updateTrip(trip.train)}/>
                <Button title={"Drop-off"} onPress={updateTrip(trip.dropOff)}/>
                <Button title={"Complete"} onPress={updateTrip(trip.complete)}/>
            </View>)
        case "stopped":
            return (<View style={styles.container}>
                <Button title={"Go"} onPress={updateTrip(trip.go)}/>
            </View>)
        case "completed":
            return (<View style={styles.container}>
                <Button title={"New Trip"} onPress={() => {
                    tripRepository.nextTrip().then(result => result.map(setTrip))
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
});

