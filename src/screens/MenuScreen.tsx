import {Button, StyleSheet, View} from "react-native";
import React, {useContext} from "react";
import {RootStackParams} from "./screenTypes";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {LoggerContext} from "../LoggerContext";
import {createLoggerFromParent} from "../utilities/logger";

export const MenuScreen: React.FC<NativeStackScreenProps<RootStackParams, 'menu'>> = ({navigation}) => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("menu")

    logger.debug("Rendering Menu")

    return (<View style={styles.container}>
        <Button title={"Trip Runner"} onPress={() => navigation.navigate('trip-runner')}/>
        <Button title={"Database Tests"} onPress={() => navigation.navigate('database-tests')}/>
    </View>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
