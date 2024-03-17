import React, {useContext, useEffect, useState} from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";
import {TripStateRepositoryContext} from "./TripStateRepositoryContext";
import {TripStateWithOrigin, TripStateWithoutOrigin, TripStateWithSavedOrigin} from "./TripStateRepositoryType";
import {Trip, TripWithOrigin, TripWithoutOrigin} from "./Trip";
import {doOnSuccess} from "../utilities/results/resultCurriers";

const defaultTripState: TripStateWithoutOrigin = {
    type: "trip-state-without-origin",
    locations: []
}

const buildTripWithOrigin = (tripState: TripStateWithOrigin | TripStateWithSavedOrigin): TripWithOrigin => {
    return {
        start: () => {
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

export const TripTrackerScreen: React.FC = () => {

    const tripStateRepository = useContext(TripStateRepositoryContext)

    const [trip, setTrip] = useState<Trip>(defaultTrip)

    useEffect(() => {
        tripStateRepository.currentTrip()
            .then(doOnSuccess(tripState => {
                switch (tripState?.type) {
                    case 'trip-state-with-origin': return setTrip(buildTripWithOrigin(tripState as TripStateWithOrigin))
                    case 'trip-state-with-saved-origin': return setTrip(buildTripWithOrigin(tripState as TripStateWithSavedOrigin))
                    case 'trip-state-without-origin': return 'TODO: handle this case'
                    default: return setTrip(defaultTrip)
                }
            }))
    }, []);

    const saveTripWithOrigin = (trip: TripWithOrigin) => {
        tripStateRepository.save(trip.state)
            .then(doOnSuccess(state => setTrip({...trip, state})))
    }

    return trip.type == 'withoutOrigin' ?
        <OriginScreen trip={trip} save={saveTripWithOrigin}/> :
        <StartScreen trip={trip}/>
}

type OriginScreenProps = {
    trip: TripWithoutOrigin,
    save: (trip: TripWithOrigin) => void
}

const OriginScreen: React.FC<OriginScreenProps> = ({trip, save}) => {
    const [originLocation, setOriginLocation] = useState<string>()

    return (<BaseView>
        <TextInput style={styles.locationInput} textAlign={"center"} onChangeText={setOriginLocation}
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
