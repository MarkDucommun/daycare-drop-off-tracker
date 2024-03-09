import {RootStackParams} from "../screenTypes";
import React, {useContext} from "react";
import {createLoggerFromParent} from "../../utilities/logger";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {LoggerContext} from "../../LoggerContext";
import {StyleSheet, Text, View} from "react-native";

export const DatabaseTestScreen: React.FC<NativeStackScreenProps<RootStackParams, 'database-tests'>> = ({navigation}) => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("database-tests")

    logger.debug("Rendering DatabaseTestScreen")

    return (<View style={styles.container}>
        <Text>Database Tests</Text>
    </View>)
}

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
