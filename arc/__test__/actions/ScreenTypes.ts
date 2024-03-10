import {RenderResult} from "@testing-library/react-native";

export type ValidateScreen<T> = (screen: RenderResult) => Promise<T>

export type Screen = HomeScreen | TripHistoryScreen

export type HomeScreen = {
    type: 'HOME_SCREEN',
    viewPastTrips: () => Promise<TripHistoryScreen>
}

export type TripHistoryScreen = {
    type: 'TRIP_HISTORY_SCREEN',
    goBack: <T extends Screen> (text: string, validateScreen: ValidateScreen<T>) => Promise<T>
}
