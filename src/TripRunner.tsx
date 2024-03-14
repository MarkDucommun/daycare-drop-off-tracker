import {NextTripWithCommit, Trip, TripActionResult, TripRepository} from "./tripTypes";
import React, {useEffect, useState} from "react";
import {doOnError, doOnSuccess, flatMap, Result} from "./utilities/results";
import {Button, StyleSheet, Text, View} from "react-native";
import {StatusBar} from "expo-status-bar";
import {Selector} from "./Selector";
import {ItemValue} from "@react-native-picker/picker/typings/Picker";
import {createLoggerFromParent, Logger} from "./utilities/logger";
import {SaveDataForEvent} from "./acceleration/useAcceleration";

type TripRunnerProps = {
    repository: TripRepository,
    saveAccelerationToo: SaveDataForEvent,
    parentLogger?: Logger
}

export const TripRunner: React.FC<TripRunnerProps> =
    ({
         repository,
         parentLogger,
         saveAccelerationToo
     }) => {

        const logger = createLoggerFromParent(parentLogger)("i", "TRACE", "yellow")
        const [trip, setTrip] = useState<Trip | undefined>()
        const [errorMessage, setErrorMessage] = useState<string | null>(null)
        const [tripStart, setTripStart] = useState<number>()
        const [legStart, setLegStart] = useState<number>()
        const [eventStart, setEventStart] = useState<number>()
        const [now, setNow] = useState<number>(Date.now())


        logger.debug("Rendering Trip Runner")

        useEffect(() => {
            if (trip == undefined) {
                repository.nextTrip()
                    .then(doOnSuccess(trip => setTrip(trip)))
                    .then(doOnError(message => setErrorMessage(message)))
            }
            const interval = setInterval(() => {
                setNow(Date.now())
            }, 1000)

            return () => clearInterval(interval)
        }, []);

        useEffect(() => {
            if (trip && !tripStart) {
                const tripSummary = trip.innerTrip().summary();
                if (tripSummary.startTime.trip != 0) {
                    setTripStart(tripSummary.startTime.trip)
                }
            }
        }, [trip]);

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
        const executeTripActionAndSaveAcceleration = <T extends Trip>(fn: () => TripActionResult<T>, accelerationType: 'go' | 'stop') =>
            () => fn().flatMapAsync(commitAndSetTrip)
                    .then(doOnSuccess(a => saveAccelerationToo.save(accelerationType).then()))

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
                    <Button title={"Start"} onPress={executeTripActionAndSaveAcceleration(trip.start, 'go')}/>
                </>)
            case "moving":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Button title={"Stoplight"} onPress={executeTripActionAndSaveAcceleration(trip.stoplight, 'stop')}/>
                    <Button title={"Train"} onPress={executeTripActionAndSaveAcceleration(trip.train, 'stop')}/>
                    <Button title={"Destination"} onPress={executeTripActionAndSaveAcceleration(trip.destination, 'stop')}/>
                </>)
            case "stopped":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Button title={"Go"} onPress={executeTripActionAndSaveAcceleration(trip.go, 'go')}/>
                </>)
            case "stoplight":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Button title={"Go"} onPress={executeTripActionAndSaveAcceleration(trip.go, 'go')}/>
                    <Button title={"Train"} onPress={executeTripAction(trip.train)}/>
                </>)
            case "destination-selection":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Selector onConfirmSelection={executeTripActionWithArg(trip.selectDestination)}
                              values={trip.locations()} selectButtonText={"Select Destination"}
                              enterNewButtonText={"Enter new location"} placeholderText={"New location..."}/>
                </>)
            case "route-selection":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Selector onConfirmSelection={executeTripActionWithArg(trip.selectRoute)}
                              values={trip.routes()} selectButtonText={"Select Route"}
                              enterNewButtonText={"Enter new route"} placeholderText={"New route..."}/>
                </>)
            case "at-destination":
                return (<>
                    {tripStart && legStart && eventStart ? (
                        <TripTimer tripStart={tripStart} legStart={legStart} eventStart={eventStart}
                                   now={now}/>) : null}
                    <Button title={"Go"} onPress={executeTripActionAndSaveAcceleration(trip.go, 'go')}/>
                    <Button title={"Complete"} onPress={executeTripAction(trip.complete)}/>
                </>)
            case "complete":
                return (<>
                    <Button title={"New Trip"} onPress={() => {
                        repository.nextTrip()
                            .then(doOnSuccess(_ => logger.info("Setting trip -")))
                            .then(doOnSuccess(tr => logger.info(tr)))
                            .then(doOnSuccess(trip => setTrip(trip)))
                            .then(doOnError(message => setErrorMessage(message)))
                    }}/>
                </>)
        }
    }

type TripTimerProps = {
    tripStart: number,
    legStart: number,
    eventStart: number,
    now: number
}

type TimerProps = {
    start: number
    now: number
    label: string
}

const Timer: React.FC<TimerProps> = ({start, now, label}) => {
    return (<>
        <Text>{label}: {formatDuration(now - start)}</Text>
    </>)
}

const TripTimer: React.FC<TripTimerProps> = ({tripStart, legStart, eventStart, now}) => {
    const duration = now - tripStart
    console.log(duration)
    return (<>
        <Timer start={tripStart} now={now} label='Trip'/>
        <Text></Text>
    </>)
}

const formatTime = (time: number) => {
    const dateObject = new Date(time);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZoneName: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', options);

    return dateFormatter.format(dateObject);
}

function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedDays = days > 0 ? `${days}d ` : '';
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedDays}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
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
