import {act, fireEvent, waitForElementToBeRemoved} from "@testing-library/react-native";
import {HomeScreen, TripHistoryScreen, ValidateScreen} from "./ScreenTypes";

export const buildValidateHomeScreen = (
    validateTripHistoryScreen: ValidateScreen<TripHistoryScreen>
): ValidateScreen<HomeScreen> => async (screen) => {

    const tripHistoryButton = await screen.findByText("View past trips")

    expect(tripHistoryButton).toBeOnTheScreen()

    return {
        type: 'HOME_SCREEN',
        screen,
        viewPastTrips: async () => await act(async () => {

            fireEvent.press(tripHistoryButton);

            await waitForElementToBeRemoved(() => screen.queryByText("View past trips"))

            return await validateTripHistoryScreen(screen)
        })
    }
}
