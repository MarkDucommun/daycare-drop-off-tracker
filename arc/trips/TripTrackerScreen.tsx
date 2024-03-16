import React, {useContext, useState} from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";
import {TripStateRepositoryContext} from "./TripStateRepositoryContext";
import {TripStateWithoutOrigin} from "./TripStateRepositoryType";
import {Trip, TripWithOrigin, TripWithoutOrigin} from "./Trip";
import {doOnSuccess} from "../utilities/results/resultCurriers";

const defaultTripState: TripStateWithoutOrigin = {
    type: "trip-state-without-origin",
    locations: []
}

const defaultTrip: TripWithoutOrigin = {
    selectOrigin(origin) {
        return {
            start: () => {},
            state: {
                type: 'trip-state-with-origin',
                locations: [...this.state.locations, origin],
                origin: origin,
            },
            type: "pending"
        }
    },
    state: defaultTripState,
    type: "withoutOrigin"
}

export const TripTrackerScreen: React.FC = () => {

    const tripStateRepository = useContext(TripStateRepositoryContext)

    const [trip, setTrip] = useState<Trip>(defaultTrip)

    return trip.type == 'withoutOrigin' ? <OriginScreen trip={trip} save={(trip) => {
        tripStateRepository.save(trip.state).then(doOnSuccess(r => {
            const newTrip: TripWithOrigin = { ...trip, state: r }
            setTrip(newTrip)
        }))
    }}/> : <StartScreen trip={trip}/>
}

type OriginScreenProps = {
    trip: TripWithoutOrigin,
    save: (trip: TripWithOrigin) => void
}

const OriginScreen: React.FC<OriginScreenProps> = ({trip, save}) => {
    const [originLocation, setOriginLocation] = useState<string>()

    return (<BaseView>
        <TextInput style={styles.locationInput} textAlign={"center"} onChangeText={setOriginLocation} placeholder="Origin location name"/>
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
}

const StartScreen: React.FC<StartScreenProps> = () => {
    return (<BaseView>
        <TouchableOpacity>
            <Text style={styles.createButton}>Start trip</Text>
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
