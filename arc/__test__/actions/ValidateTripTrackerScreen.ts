import {TripTrackerScreen, ValidateScreen} from "./ScreenTypes";
import {act, fireEvent, waitForElementToBeRemoved} from "@testing-library/react-native";

export const buildValidateTripTrackerScreen = (): ValidateScreen<TripTrackerScreen> => async (screen) => {

    const tripTrackerTitle = await screen.findByText("Trip Tracker")

    expect(tripTrackerTitle).toBeOnTheScreen()

    return {
        type: 'TRIP_TRACKER_SCREEN',
        screen,
        goBack: async (text, validateScreen) => {

            const homeButton = await screen.findByText(text)

            return await act(async () => {

                fireEvent.press(homeButton);

                await waitForElementToBeRemoved(() => screen.queryByText("Trip Tracker"))

                const newScreen =  validateScreen(screen)

                await new Promise(resolve => setTimeout(resolve, 100))

                return newScreen
            })
        }
    }
}
