import React, {useContext} from "react";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {RootStackParams} from "./screenTypes";
import {createLoggerFromParent} from "../utilities/logger";
import {LoggerContext} from "../LoggerContext";
import {Button, StyleSheet, Text, View} from "react-native";

export const TripRunnerScreen: React.FC<NativeStackScreenProps<RootStackParams, 'trip-runner'>> = ({navigation}) => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("trip-runner")

    logger.debug("Rendering Trip Runner")

    return (<View style={styles.container}>
        <Text>At Trip Runner</Text>
    </View>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

