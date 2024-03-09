import {StyleSheet, Text, View} from "react-native";
import React from "react";

type TODOProps = {message?: string}

export const TODO: React.FC<TODOProps> = ({message}) =>
    <View style={styles.container}>
        <Text>TODO - {message || "NOT IMPLEMENTED"}</Text>
    </View>

export const Loading = () =>
    <View style={styles.container}>
        <Text>....Loading......</Text>
    </View>

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
