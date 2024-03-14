import React from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {StyleSheet, Text, TextInput, TouchableOpacity} from "react-native";

export const TripTrackerScreen: React.FC = () => {

    return (<BaseView>
        <TextInput style={styles.locationInput} textAlign={"center"} placeholder="Origin location name"/>
        <TouchableOpacity>
            <Text style={styles.createButton}>Create location</Text>
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
