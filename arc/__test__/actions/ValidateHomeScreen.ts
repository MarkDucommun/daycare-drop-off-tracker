import {act, fireEvent, waitForElementToBeRemoved} from "@testing-library/react-native";
import {HomeScreen, TripHistoryScreen, TripTrackerScreen, ValidateScreen} from "./ScreenTypes";

export const buildValidateHomeScreen = (
    validateTripHistoryScreen: ValidateScreen<TripHistoryScreen>,
    validateTripTrackerScreen: ValidateScreen<TripTrackerScreen>
): ValidateScreen<HomeScreen> => async (screen) => {

    const tripHistoryButton = await screen.findByText("View past trips")
    const tripTrackerButton = await screen.findByText("Track a trip")

    expect(tripHistoryButton).toBeOnTheScreen()
    expect(tripTrackerButton).toBeOnTheScreen()

    return {
        type: 'HOME_SCREEN',
        screen,
        viewPastTrips: async () => await act(async () => {

            fireEvent.press(tripHistoryButton)

            await waitForElementToBeRemoved(() => screen.queryByText("View past trips"))

            const newScreen = await validateTripHistoryScreen(screen);

            await new Promise(resolve => setTimeout(resolve, 100))

            return newScreen
        }),
        viewTripTracker: async () => await act(async () => {

            fireEvent.press(tripTrackerButton);

            await waitForElementToBeRemoved(() => screen.queryByText("Track a trip"))

            const newScreen = await validateTripTrackerScreen(screen)

            await new Promise(resolve => setTimeout(resolve, 100))

            return newScreen
        })
    }
}
