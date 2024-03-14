import React from "react";
import {baseStyles, BaseView} from "../styles/baseView";
import {TouchableOpacity, Text} from "react-native";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {AppStackParams, ScreenName} from "./AppStackParams";

export const HomeScreen: React.FC<NativeStackScreenProps<AppStackParams, 'Home'>> = ({navigation}) => {

    const navigate = (screen: ScreenName) => () => navigation.navigate(screen)

    return (<BaseView>
        <TouchableOpacity onPress={navigate('Trip History')}>
            <Text style={{...baseStyles.baseFont}}>View past trips</Text>
        </TouchableOpacity>
    </BaseView>)
}
