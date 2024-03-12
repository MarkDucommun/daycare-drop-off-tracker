import React, {Dispatch, SetStateAction, useEffect, useState} from "react";
import {InitialState, NavigationContainer, NavigationState} from "@react-navigation/native";
import {Stack} from "./navigation/nativeStack";
import {HomeScreen} from "./navigation/HomeScreen";
import {TripHistoryScreen} from "./trips/TripHistoryScreen";
import {BaseView} from "./styles/baseView";
import {Text} from "react-native";
import {NavigationStateRepository} from "./navigation/NavigationStateRepositoryType";
import {doOnSuccess, onSuccessSetState} from "./utilities/results/resultCurriers";
import {betterConsole} from "./utilities/logging/betterConsole";


type AppProps = {
    navigationStateRepository: NavigationStateRepository
}

type SaveState = (state?: NavigationState) => void

const saveState = (repository: NavigationStateRepository): SaveState => (state) => {
    repository.save(state).then()
}

export const AppEntry: React.FC<AppProps> = ({navigationStateRepository}) => {

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
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen}/>
            <Stack.Screen name="Trip History" component={TripHistoryScreen}/>
        </Stack.Navigator>
    </NavigationContainer>)
}
