import {StyleSheet, View} from "react-native";
import React from "react";

export const BaseView: React.FC<{ children?: React.ReactNode }> = ({children}) =>
    <View style={{...baseStyles.container}}>{children}</View>

export const baseStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
