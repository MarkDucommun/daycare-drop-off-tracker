import {TripTrackerScreen, TripTrackerStartScreen, ValidateScreen} from "./ScreenTypes";
import {act, fireEvent} from "@testing-library/react-native";

export const buildValidateTripTrackerScreen = (
    validateTripTrackerStartScreen: ValidateScreen<TripTrackerStartScreen>
): ValidateScreen<TripTrackerScreen> => async (screen) => {

    const tripTrackerTitle = await screen.findByText("Trip Tracker")

    expect(tripTrackerTitle).toBeOnTheScreen()

    return {
        type: 'TRIP_TRACKER_SCREEN',
        screen,
        goBack: async (text, validateScreen) => {

            const homeButton = await screen.findByText(text)

            return await act(async () => {

                fireEvent.press(homeButton);

                const newScreen =  validateScreen(screen)

                await new Promise(resolve => setTimeout(resolve, 100))

                return newScreen
            })
        },
        enterNewOrigin: async (origin) => {

            const locationInput = await screen.findByPlaceholderText("Origin location name");

            await act(async () => fireEvent.changeText(locationInput, "Daycare"))

            const createLocationButton = await screen.findByText("Create location")

            await act(async () => {
                fireEvent.press(createLocationButton);
                await new Promise(resolve => setTimeout(resolve, 100))
            })

            const newScreen = await validateTripTrackerStartScreen(screen)

            await new Promise(resolve => setTimeout(resolve, 100))

            return newScreen
        }
    }
}
