import React, {useContext, useEffect, useState} from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";
import {TripStateRepositoryContext} from "./TripStateRepositoryContext";
import {
    TripState,
    TripStateWithOrigin,
    TripStateWithoutOrigin,
    TripStateWithSavedOrigin
} from "./TripStateRepositoryType";
import {Trip, TripWithOrigin, TripWithoutOrigin} from "./Trip";
import {doOnSuccess} from "../utilities/results/resultCurriers";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {AppStackParams} from "../navigation/AppStackParams";
import {AlertManagerContext} from "../utilities/alert-manager/AlertManagerContext";
import {ActionButton} from "../utilities/alert-manager/AlertManager";

const defaultTripState: TripStateWithoutOrigin = {
    type: "trip-state-without-origin",
    locations: []
}

const buildTripWithOrigin = (tripState: TripStateWithOrigin | TripStateWithSavedOrigin): TripWithOrigin => {
    return {
        start: () => {
        },
        cancel: () => {
            return {
                type: "canceled",
                state: {...tripState, cancelled: true}
            }
        },
        state: tripState,
        type: "pending"
    }
}

const defaultTrip: TripWithoutOrigin = {
    selectOrigin(origin) {
        return buildTripWithOrigin({
            type: 'trip-state-with-origin',
            locations: [...this.state.locations, origin],
            origin: origin,
        })
    },
    state: defaultTripState,
    type: "withoutOrigin"
}

export const TripTrackerScreen: React.FC<NativeStackScreenProps<AppStackParams, 'Trip Tracker'>> = ({navigation}) => {

    const tripStateRepository = useContext(TripStateRepositoryContext)

    const [trip, setTrip] = useState<Trip>(defaultTrip)

    useEffect(() => {
        tripStateRepository.currentTrip()
            .then(doOnSuccess(tripState => {
                switch (tripState?.type) {
                    case 'trip-state-with-origin':
                        return setTrip(buildTripWithOrigin(tripState as TripStateWithOrigin))
                    case 'trip-state-with-saved-origin':
                        return setTrip(buildTripWithOrigin(tripState as TripStateWithSavedOrigin))
                    case 'trip-state-without-origin':
                        return 'TODO: handle this case'
                    default:
                        return setTrip(defaultTrip)
                }
            }))
    }, []);

    const saveTripWithOrigin = (trip: TripWithOrigin) => {
        tripStateRepository.save(trip.state)
            .then(doOnSuccess(state => setTrip({...trip, state})))
    }

    const goHome = () => navigation.navigate('Home')

    return trip.type == 'withoutOrigin' ?
        <OriginScreen trip={trip} save={saveTripWithOrigin}/> :
        <StartScreen trip={trip} goHome={goHome} save={tripStateRepository.save}/>
}

type OriginScreenProps = {
    trip: TripWithoutOrigin,
    save: (trip: TripWithOrigin) => void
}

const OriginScreen: React.FC<OriginScreenProps> = ({trip, save}) => {
    const [originLocation, setOriginLocation] = useState<string>()

    return (<BaseView>
        <TextInput accessibilityLabel="create-location-input" style={styles.locationInput} textAlign={"center"} onChangeText={setOriginLocation}
                   placeholder="Origin location name"/>
        <TouchableOpacity onPress={() => {
            // TODO validate cannot submit empty location
            save(trip.selectOrigin(originLocation!!))
        }}
        >
            <Text style={styles.createButton}>Create location</Text>
        </TouchableOpacity>
    </BaseView>)
}

type StartScreenProps = {
    trip: TripWithOrigin,
    save: (trip: TripState) => void,
    goHome: () => void
}

const StartScreen: React.FC<StartScreenProps> = ({trip, goHome, save}) => {

    const alertManager = useContext(AlertManagerContext)

    // TODO is this too much logic in a Trip action screen?

    const confirmCancel: ActionButton = {
        text: 'Yes',
        onPress: () => {
            const canceledTrip = trip.cancel();
            save(canceledTrip.state)
            goHome()
        },
        style: 'destructive',
    }
    const cancel: ActionButton = {
        text: 'No',
        onPress: () => console.log('Cancelled'),
        style: 'cancel',
    }

    return (<BaseView>
        <Text
            style={baseStyles.baseFont}>At {trip.state.type === "trip-state-with-origin" ? trip.state.origin : trip.state.origin.name}</Text>
        <TouchableOpacity>
            <Text style={styles.createButton}>Start trip</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={alertManager.createConfirmation('Cancel trip', confirmCancel, cancel, "Are you sure?")}>
            <Text style={styles.createButton}>Cancel trip</Text>
        </TouchableOpacity>
    </BaseView>)
}

const styles = StyleSheet.create({
    locationInput: {
        ...baseStyles.baseFont,
        fontSize: 15,
        height: 40,
        width: '70%',
    },
    createButton: {
        ...baseStyles.baseFont,
        padding: 10,
        fontSize: 15
    },
});
