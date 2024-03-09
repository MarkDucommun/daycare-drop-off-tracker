import {Button, StyleSheet, View} from "react-native";
import React, {useContext} from "react";
import {RootStackParams, ScreenName} from "../screenTypes";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {LoggerContext} from "../../LoggerContext";
import {createLoggerFromParent} from "../../utilities/logger";

export const MenuScreen: React.FC<NativeStackScreenProps<RootStackParams, 'menu'>> = ({navigation}) => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("menu")

    logger.debug("Rendering Menu")

    const navigate = (screen: ScreenName) => () => navigation.navigate(screen)

    return (<View style={styles.container}>
        <Button title={"Trip Runner"} onPress={navigate('trip-runner')}/>
        <Button title={"Last Trip Summary"} onPress={navigate('trip-summary')}/>
        <Button title={"Trip History"} onPress={navigate('trip-list')}/>
        <Button title={"Database Tests"} onPress={navigate('database-tests')}/>
        <Button title={"Accelerometer Tests"} onPress={navigate('acceleration-tests')}/>
        <Button title={"Accelerometer Results"} onPress={navigate('acceleration-results')}/>
        <Button title={"Accelerometer Lists"} onPress={navigate('acceleration-lists')}/>
        <Button title={"Carousel"} onPress={navigate('carousel')}/>
        <Button title={"File Explorer"} onPress={navigate('file-explorer')}/>
    </View>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
