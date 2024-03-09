import {NavigationState, useNavigation} from "@react-navigation/native";
import {RootStackParams, ScreenName} from "./screenTypes";
import {Result, successIfDefined} from "../utilities/results";
import {Logger} from "../utilities/logger";
import {StyleSheet} from "react-native";
import React, {useEffect} from "react";
import {MenuScreen} from "./screens/MenuScreen";
import {DatabaseTestScreen} from "./screens/DatabaseTestScreen";
import {TripRunnerScreen} from "./screens/TripRunnerScreen";
import {Stack} from "./nativeStackProvider";
import {TripSummaryScreen} from "./screens/TripSummaryScreen";
import {AccelerationTestScreen} from "../acceleration/screens/AccelerationTestScreen";
import {TripListScreen} from "./screens/TripListScreen";
import {CarouselScreen} from "./screens/CarouselScreen";
import {AccelerationResultsScreen} from "../acceleration/screens/AccelerationResultsScreen";
import {AccelerationsListScreen} from "../acceleration/screens/AccelerationsListScreen";
import {FileExplorerScreen} from "./screens/FileExplorerScreen";

export type ScreenNavigatorProps = {
    initialScreen: ScreenName,
    saveScreen: (screen: ScreenName) => void,
    logger: Logger
}

export const ScreenNavigator: React.FC<ScreenNavigatorProps> =
    ({initialScreen, saveScreen, logger}) => {

    const {addListener} = useNavigation()

    useEffect(() => {
        addListener('state', e => {
            useRouteName(e.data.state)
                .doOnSuccess(saveScreen)
                .doOnSuccess(screen => logger.info(`Screen changed to: ${screen}`))
        })
    }, [addListener]);

    return (
        <Stack.Navigator initialRouteName={'menu'}>
            <Stack.Screen name="menu" component={MenuScreen}/>
            <Stack.Screen name="database-tests" component={DatabaseTestScreen}/>
            <Stack.Screen name="acceleration-tests" component={AccelerationTestScreen}/>
            <Stack.Screen name="acceleration-results" component={AccelerationResultsScreen}/>
            <Stack.Screen name="acceleration-lists" component={AccelerationsListScreen}/>
            <Stack.Screen name="trip-runner" component={TripRunnerScreen}/>
            <Stack.Screen name="trip-summary" component={TripSummaryScreen}/>
            <Stack.Screen name="trip-list" component={TripListScreen}/>
            <Stack.Screen name="carousel" component={CarouselScreen}/>
            <Stack.Screen name="file-explorer" component={FileExplorerScreen}/>
        </Stack.Navigator>
    );
}

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

