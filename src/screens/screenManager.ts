import {ReactElement} from "react";
import {SQLiteDatabase} from "expo-sqlite";
import {TransactionCreator} from "../utilities/databaseAccess";

export type MenuScreen = {
    type: "menu"
    tripRunner: () => TripRunnerScreen,
    render: (transactionCreator: TransactionCreator) => ReactElement
}

export type TripRunnerScreen = {
    type: "tripRunner"
} & NonMenuScreen

export type DatabaseTestScreen = {
    type: "databaseTest"
} & NonMenuScreen

export type NonMenuScreen = {
    goToMenu: () => MenuScreen
    render: (transactionCreator: TransactionCreator) => ReactElement
}

export type Screeen = MenuScreen | TripRunnerScreen | DatabaseTestScreen
