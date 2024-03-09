import React from "react";
import {BaseView} from "../styles/baseView";
import {Button} from "react-native";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {AppStackParams, ScreenName} from "./AppStackParams";

export const HomeScreen: React.FC<NativeStackScreenProps<AppStackParams, 'Home'>> = ({navigation}) => {

    const navigate = (screen: ScreenName) => () => navigation.navigate(screen)

    return (<BaseView>
        <Button title="View past trips" onPress={navigate('Trip History')}/>
    </BaseView>)
}
