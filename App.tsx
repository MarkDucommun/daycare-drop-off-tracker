import {StatusBar} from 'expo-status-bar';
import {Button, StyleSheet, Text, View} from 'react-native';
import React, {useEffect, useState} from "react";
import {TripRepository} from "./src/tripToo";
import {TripRunner} from "./src/TripRunner";
import {buildFakeTripRepository} from "./src/repository/tripRepository";
import {cleanDatabaseFile} from "./src/DatabaseIntegrationTest";

// function openDatabase() {
//     const db = SQLite.openDatabase("daycare-dropoff-v2.db");
//     return db;
// }
//
// const db = openDatabase()
//
// async function initializeTrip(
//     tripRepository: TripRepository,
//     trip: Trip | undefined,
//     setTrip: (it: Trip) => void,
//     setErrorMessage: (it: string) => void
// ) {
//     if (trip == undefined) {
//         console.log("Loading trip...")
//         const tripResults = await tripRepository.nextTrip();
//         tripResults.map(trip => {
//             console.log("Setting trip: ")
//             console.log(trip)
//             setTrip(trip)
//         }).mapError(setErrorMessage)
//     } else {
//         console.log(trip)
//     }
// }

// async function dbTests(tripRepository: TripRepository, setErrorMessage: (it: string) => void) {
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

// async function initializeRoutes(
//     tripRepository: TripRepository,
//     routes: Array<string>,
//     setRoutes: (it: Array<string>) => void,
//     setErrorMessage: (it: string) => void
// ) {
//     if (routes.length == 0) {
//         const routesResult = await tripRepository.getRoutes();
//
//         routesResult.map((routes) => {
//             console.log(routes)
//             setRoutes(routes)
//         }).mapError(setErrorMessage)
//     }
// }


export default function App() {

    // useEffect(() => {
    //     console.log("Running tests")
    //     cleanDatabaseFile().then(() => setErrorMessage("Opened database"))
    // }, []);

    // TODO build a modal for overall summary of data
    // TODO build a list view that allows for inspecting each trip
    // TODO maybe an admin page for inspecting SQLite instance? Can we export SQLite instance to introspect it?

    // const [tripRepository, setTripRepository] = useState<TripRepository>()
    // // const [trip, setTrip] = useState<Trip | undefined>()
    // // const [routes, setRoutes] = useState<Array<string>>([])
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    // // const [selectedRoute, setSelectedRoute] = useState<ItemValue>();
    // //
    // useEffect(() => {
    //     const tripRepository = buildFakeTripRepository();
    //     setTripRepository(tripRepository)
    // }, []);

    // useEffect(() => {
    //     if (tripRepository != undefined) {
    //         initializeRoutes(tripRepository, routes, setRoutes, setErrorMessage).then()
    //         initializeTrip(tripRepository, trip, setTrip, setErrorMessage).then()
    //     }
    // }, [tripRepository]);


    // if (errorMessage != null) {
    //     return (<View style={styles.container}>
    //         {/*<Text>Error: {errorMessage}</Text>*/}
    //         <Button title={'Run tests'} onPress={() => cleanDatabaseFile().then()}/>
    //         <StatusBar style="auto"/>
    //     </View>)
    // } else {
        return (<View style={styles.container}>
            <Button title={'Run tests'} onPress={cleanDatabaseFile}/>
        </View>)
    // }

    // if (tripRepository) {
    //     return <TripRunner repository={tripRepository}/>
    // }

    // if (routes.length != 0) {
    //     return (<View style={styles.container}>
    //         {routes.map((route, i) => <Text key={`route-${i}`}>{route}</Text>)}
    //         <StatusBar style="auto"/>
    //     </View>)
    // }

    // if (!tripRepository || !trip) {
    //     console.log("Nothing loaded yet")
    //     return (<View style={styles.container}>
    //         <Text>Starting app...</Text>
    //         <StatusBar style="auto"/>
    //     </View>)
    // }
    //
    // const updateTrip = (fn: () => Trip) => async () => {
    //     const nextTrip = fn()
    //     console.log(nextTrip.innerTrip().events())
    //     const result = await tripRepository.save(nextTrip.innerTrip())
    //     result.map(() => setTrip(nextTrip)).mapError(setErrorMessage)
    // }
    //
    // // SHOW SEGMENT DURATION IF NOT PENDING OR COMPLETED
    // // SHOW TOTAL DURATION IF NOT PENDING OR COMPLETED
    //
    // switch (trip.type) {
    //     case "pending":
    //         return (<View style={styles.container}>
    //             <Button title={"Load Trip"} onPress={() => {
    //                 tripRepository.nextTrip().then((result) => {
    //                     result.map(setTrip)
    //                 })
    //             }}/>
    //             <Button title={"Start"} onPress={updateTrip(trip.start)}/>
    //         </View>)
    //     case "moving":
    //         return (<View style={styles.container}>
    //             <Button title={"Stoplight"} onPress={updateTrip(trip.stoplight)}/>
    //             <Button title={"Train"} onPress={updateTrip(trip.train)}/>
    //             <Button title={"Drop-off"} onPress={updateTrip(trip.dropOff)}/>
    //             <Button title={"Complete"} onPress={updateTrip(trip.complete)}/>
    //         </View>)
    //     case "stopped":
    //         return (<View style={styles.container}>
    //             <Button title={"Go"} onPress={updateTrip(trip.go)}/>
    //         </View>)
    //     case "inbound-selection":
    //         return (<View style={styles.container}>
    //             <PickerIOS onValueChange={value => trip.assignInboundRoute(value as string)}>
    //                 {routes.map(route => (<PickerIOS.Item key={route} value={route} label={route}/>))}
    //             </PickerIOS>
    //             <Button title={"Assign Route"} />
    //         </View>)
    //     case "outbound-selection":
    //         return (<View style={styles.container}>
    //             <Text>OUTBOUND</Text>
    //             <Picker style={styles.pickerStyles} onValueChange={value => {
    //                 setSelectedRoute(value)
    //                 console.log("Selected: " + value)
    //                 trip.assignOutboundRoute(value as string)
    //             }} selectedValue={selectedRoute} numberOfLines={2} enabled={true} placeholder={"SELECT"} mode={"dropdown"}>
    //                 {routes.map(route => (<Picker.Item value={route} label={route} key={route}/>))}
    //             </Picker>
    //             <Button title={"Assign Route"} onPress={() => {
    //                 if (selectedRoute) {
    //                     updateTrip(() => trip.assignOutboundRoute(selectedRoute as string))
    //             }}} />
    //         </View>)
    //     case "completed":
    //         return (<View style={styles.container}>
    //             <Button title={"New Trip"} onPress={() => {
    //                 tripRepository.nextTrip().then(result => result.map(setTrip))
    //             }}/>
    //         </View>)
    // }
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

