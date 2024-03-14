import React from "react";
import {Text} from "react-native";
import {BaseView} from "../styles/baseView";

type TODOProps = {message?: string}

export const TODO: React.FC<TODOProps> = ({message}) =>
    <BaseView>
        <Text>TODO - {message || "NOT IMPLEMENTED"}</Text>
    </BaseView>
