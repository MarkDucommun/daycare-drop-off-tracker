import {ReactElement} from "react";
import {SQLiteDatabase} from "expo-sqlite";

export type MenuScreen = {
    type: "menu"
    tripRunner: () => TripRunnerScreen,
    render: (db: SQLiteDatabase) => ReactElement
}

export type TripRunnerScreen = {
    type: "tripRunner"
} & NonMenuScreen

export type DatabaseTestScreen = {
    type: "databaseTest"
} & NonMenuScreen

export type NonMenuScreen = {
    goToMenu: () => MenuScreen
    render: (db: SQLiteDatabase) => ReactElement
}

export type Screeen = MenuScreen | TripRunnerScreen | DatabaseTestScreen
