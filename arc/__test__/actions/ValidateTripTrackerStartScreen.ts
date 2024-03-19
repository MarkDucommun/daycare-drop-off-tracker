import {TripTrackerStartScreen, ValidateScreen} from "./ScreenTypes";
import {act, fireEvent, waitForElementToBeRemoved} from "@testing-library/react-native";

export const buildValidateTripTrackerStartScreen = (): ValidateScreen<TripTrackerStartScreen> => async (screen) => {

    const tripTrackerTitle = await screen.findByText("Trip Tracker")

    expect(tripTrackerTitle).toBeOnTheScreen()

    const startButton = await screen.findByText("Start trip")

    expect(startButton).toBeOnTheScreen()

    return {
        type: 'TRIP_TRACKER_START_SCREEN',
        screen,
        goBack: async (text, validateScreen) => {

            const homeButton = await screen.findByText(text)

            return await act(async () => {

                fireEvent.press(homeButton);

                await waitForElementToBeRemoved(() => screen.queryByText("Trip Tracker"))

                const newScreen = validateScreen(screen)

                await new Promise(resolve => setTimeout(resolve, 100))

                return newScreen
            })
        },
        cancelTrip: async (validateScreen) => {

            const cancelButton = await screen.findByText("Cancel trip")

            return await act(async () => {
                fireEvent.press(cancelButton);

                await new Promise(resolve => setTimeout(resolve, 100))

                const newScreen = validateScreen(screen)

                await new Promise(resolve => setTimeout(resolve, 100))

                return newScreen
            })
        }
    }
}
