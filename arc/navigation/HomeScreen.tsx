import React from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {StyleSheet, Text, TouchableOpacity} from "react-native";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {AppStackParams, ScreenName} from "./AppStackParams";

export const HomeScreen: React.FC<NativeStackScreenProps<AppStackParams, 'Home'>> = ({navigation}) => {

    const navigate = (screen: ScreenName) => () => navigation.navigate(screen)

    return (<BaseView>
            <TouchableOpacity onPress={navigate('Trip Tracker')}>
                <Text style={styles.menuOptions}>Track a trip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={navigate('Trip History')}>
                <Text style={styles.menuOptions}>View past trips</Text>
            </TouchableOpacity>
    </BaseView>)
}

const styles = StyleSheet.create({
    menuOptions: {
        ...baseStyles.baseFont,
        padding: 10,
        fontSize: 15
    },
});
