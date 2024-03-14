import {RenderResult} from "@testing-library/react-native";

export type ValidateScreen<T> = (screen: RenderResult) => Promise<T>

export type Screen = HomeScreen | TripHistoryScreen

export type HomeScreen = {
    type: 'HOME_SCREEN'
    viewPastTrips: () => Promise<TripHistoryScreen>
    viewTripTracker: () => Promise<TripTrackerScreen>
    screen: RenderResult
}

export type TripHistoryScreen = {
    type: 'TRIP_HISTORY_SCREEN'
    goBack: <T extends Screen> (text: string, validateScreen: ValidateScreen<T>) => Promise<T>
    screen: RenderResult
}

export type TripTrackerScreen = {
    type: 'TRIP_TRACKER_SCREEN'
    goBack: <T extends Screen> (text: string, validateScreen: ValidateScreen<T>) => Promise<T>
    screen: RenderResult
}
