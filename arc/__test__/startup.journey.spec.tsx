import '@testing-library/react-native/extend-expect';
import {AppEntry} from "../AppEntry";
import {render} from "@testing-library/react-native";
import {validateHomeScreen} from "./actions";

// TODO use database access through better-sqlite3
jest.mock("../navigation/nativeStack", () => jest.requireActual('../navigation/stack'))

describe("App startup journey", () => {

    test("it can navigate to the Trip History screen from the Home screen", async () => {

        const screen = render(<AppEntry/>);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()
    })

    test("it can navigate back to Home from Trip History", async () => {

        const screen = render(<AppEntry/>);

        const homeScreen = await validateHomeScreen(screen);

        const tripHistoryScreen = await homeScreen.viewPastTrips()

        await tripHistoryScreen.goBack("Home", validateHomeScreen);
    })
})
