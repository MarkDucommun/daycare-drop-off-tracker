import {NavigationState, useNavigation} from "@react-navigation/native";
import {RootStackParams, ScreenName} from "./screenTypes";
import {Result, successIfDefined} from "../utilities/results";
import {createNativeStackNavigator} from "@react-navigation/native-stack";
import {Logger} from "../utilities/logger";
import {Button, StyleSheet, Text, View} from "react-native";
import React, {useEffect} from "react";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {MenuScreen} from "./MenuScreen";
import {DatabaseTestScreen} from "./DatabaseTestScreen";
import {TripRunnerScreen} from "./TripRunnerScreen";

export type ScreenNavigatorProps = {
    initialScreen: ScreenName,
    saveScreen: (screen: ScreenName) => void,
    logger: Logger
}

const NativeStack = createNativeStackNavigator<RootStackParams>();

export const ScreenNavigator: React.FC<ScreenNavigatorProps> =
    ({initialScreen, saveScreen, logger}) => {

    const {addListener} = useNavigation()

    useEffect(() => {
        addListener('state', e => useRouteName(e.data.state).doOnSuccess(saveScreen))
    }, [addListener]);

    const One: React.FC<NativeStackScreenProps<RootStackParams, '1'>> = ({navigation}) => {
        return (
            <View style={styles.container}>
                <Button title={"Go to two"} onPress={() => navigation.navigate('2')}/>
                <Button title={"Go to three"} onPress={() => navigation.navigate('3')}/>
            </View>
        );
    }

    const Two: React.FC<NativeStackScreenProps<RootStackParams, '2'>> = ({navigation}) => {
        return (
            <View style={styles.container}>
                <Button title={"Go to one"} onPress={() => navigation.navigate('1')}/>
                <Button title={"Go to three"} onPress={() => navigation.navigate('3')}/>
            </View>
        );
    }
    const Three: React.FC<NativeStackScreenProps<RootStackParams, '3'>> = ({navigation}) => {
        return (
            <View style={styles.container}>
                <Button title={"Go to one"} onPress={() => navigation.navigate('1')}/>
                <Button title={"Go to two"} onPress={() => navigation.navigate('2')}/>
            </View>
        );
    }

    return (
        <NativeStack.Navigator initialRouteName={initialScreen}>
            <NativeStack.Screen name="menu" component={MenuScreen} options={{animation: 'fade'}}/>
            <NativeStack.Screen name="database-tests" component={DatabaseTestScreen} options={{animation: 'fade'}}/>
            <NativeStack.Screen name="trip-runner" component={TripRunnerScreen} options={{animation: 'fade'}}/>
        </NativeStack.Navigator>
    );
}

export const Loading = () =>
    <View style={styles.container}>
        <Text>....Loading......</Text>
    </View>

const useRouteName = (state: NavigationState<RootStackParams> | null): Result<string, ScreenName> =>
    successIfDefined(state)
        .map(({routes, index}) => routes[index].name)
        .mapError(_ => 'No state yet')

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

