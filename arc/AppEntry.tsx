import React from "react";
import {NavigationContainer} from "@react-navigation/native";
import {Stack} from "./navigation/nativeStack";
import {HomeScreen} from "./navigation/HomeScreen";
import {TripHistoryScreen} from "./trips/TripHistoryScreen";

type AppProps = {

}

export const AppEntry: React.FC<AppProps> = () => {

    return (<NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
            <Stack.Screen name="Home" component={HomeScreen}/>
            <Stack.Screen name="Trip History" component={TripHistoryScreen}/>
        </Stack.Navigator>
    </NavigationContainer>)
}
