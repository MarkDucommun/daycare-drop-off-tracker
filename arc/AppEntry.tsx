import React, {useEffect, useState} from "react";
import {InitialState, NavigationContainer, NavigationState} from "@react-navigation/native";
import {Stack} from "./navigation/nativeStack";
import {HomeScreen} from "./navigation/HomeScreen";
import {TripHistoryScreen} from "./trips/TripHistoryScreen";
import {BaseView} from "./styles/baseView";
import {Text} from "react-native";
import {NavigationStateRepository} from "./navigation/NavigationStateRepositoryType";
import {onSuccessSetState} from "./utilities/results/resultCurriers";
import {TripStateRepository} from "./trips/TripStateRepositoryType";
import {TripStateRepositoryProvider} from "./trips/TripStateRepositoryContext";
import {TimeProviderProvider} from "./utilities/time/TimeProviderContext";
import {TimeProvider} from "./utilities/time/TimeProvider";
import {TripTrackerScreen} from "./trips/TripTrackerScreen";
import {AlertManager} from "./utilities/alert-manager/AlertManager";
import {AlertManagerProvider} from "./utilities/alert-manager/AlertManagerContext";


type AppProps = {
    navigationStateRepository: NavigationStateRepository
    tripStateRepository: TripStateRepository
    alertManager?: AlertManager
    timeProvider?: TimeProvider
}

type SaveState = (state?: NavigationState) => void

const saveState = (repository: NavigationStateRepository): SaveState => (state) => {
    repository.save(state).then()
}

export const AppEntry: React.FC<AppProps> = (
    {
        navigationStateRepository,
        tripStateRepository,
        timeProvider,
        alertManager
    }) => {

    const [isReady, setIsReady] = useState(false)
    const [initialState, setInitialState] = useState<InitialState | undefined>()

    const nowReady = () => setIsReady(true)

    useEffect(() => {
        if (!isReady) {
            navigationStateRepository.retrieve()
                .then(onSuccessSetState(setInitialState))
                .then(nowReady)
        }

    }, [isReady]);

    if (!isReady) return <BaseView><Text>LOADING</Text></BaseView>

    return (<NavigationContainer onStateChange={saveState(navigationStateRepository)} initialState={initialState}>
        <TimeProviderProvider injectedProvider={timeProvider}>
            <AlertManagerProvider injectedAlertManager={alertManager}>
                <TripStateRepositoryProvider injectedRepository={tripStateRepository}>
                    <Stack.Navigator initialRouteName="Home" screenOptions={screenOptions}>
                        <Stack.Screen name="Home" component={HomeScreen}/>
                        <Stack.Screen name="Trip History" component={TripHistoryScreen}/>
                        <Stack.Screen name="Trip Tracker" component={TripTrackerScreen}/>
                    </Stack.Navigator>
                </TripStateRepositoryProvider>
            </AlertManagerProvider>
        </TimeProviderProvider>
    </NavigationContainer>)
}

const screenOptions: {} = {
    headerTitleStyle: {
        fontFamily: 'Menlo-Regular',
        fontWeight: 'bold'
    },
    headerBackTitleStyle: {
        fontFamily: 'Menlo-Regular'
    }
}
