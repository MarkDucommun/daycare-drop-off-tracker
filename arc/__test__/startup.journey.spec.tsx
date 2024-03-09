import '@testing-library/react-native/extend-expect';
import {AppEntry} from "../AppEntry";
import {act, fireEvent, render} from "@testing-library/react-native";

// TODO use database access through better-sqlite3
jest.mock("../navigation/nativeStack", () => jest.requireActual('../navigation/stack'))

describe("App startup journey", () => {

    test("it can navigate to the Trip History screen from the Home screen", async () => {

        const screen = render(<AppEntry/>);

        const tripHistoryButton = await screen.findByText("View past trips")

        expect(tripHistoryButton).toBeOnTheScreen()


        await act(async () => {

            fireEvent.press(tripHistoryButton)

            const tripHistoryTitle = await screen.findByText("Trip History")

            expect(tripHistoryTitle).toBeOnTheScreen()
        })


    })
})
