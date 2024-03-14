import {act, fireEvent, waitForElementToBeRemoved} from "@testing-library/react-native";
import {TripHistoryScreen, ValidateScreen} from "./ScreenTypes";

export const buildValidateTripHistoryScreen = (): ValidateScreen<TripHistoryScreen> => async (screen) => {

    const tripHistoryTitle = await screen.findByText("Trip History")

    expect(tripHistoryTitle).toBeOnTheScreen()

    return {
        type: 'TRIP_HISTORY_SCREEN',
        screen,
        goBack: async (text, validateScreen) => {

            const homeButton = await screen.findByText(text)

            return await act(async () => {

                fireEvent.press(homeButton);

                await waitForElementToBeRemoved(() => screen.queryByText("Trip History"))

                const newScreen =  validateScreen(screen)

                await new Promise(resolve => setTimeout(resolve, 10))

                return newScreen
            })
        }
    }
}
