import '@testing-library/react-native/extend-expect';
import {AppEntry} from "../AppEntry";
import {render, within} from "@testing-library/react-native";
import {validateHomeScreen, validateTripHistoryScreen} from "./actions";
import {buildInMemoryNavigationStateRepository} from "../navigation/InMemoryNavigationStateRepository";
import {buildDatabaseNavigationStateRepository} from "../navigation/SQLiteNavigationStateRepository";
import {databaseFromFileAsync} from "../utilities/database/BetterSQLiteDatabaseAccess";

jest.mock("../navigation/nativeStack", () => jest.requireActual('../navigation/stack'))

describe("App startup journey", () => {

    test("it can navigate to the Trip History screen from the Home screen", async () => {

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepositoryController.getRepository()}/>);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()
    })

    test("it can navigate back to Home from Trip History", async () => {

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepositoryController.getRepository()}/>);

        const homeScreen = await validateHomeScreen(screen);

        const tripHistoryScreen = await homeScreen.viewPastTrips()

        await tripHistoryScreen.goBack("Home", validateHomeScreen);
    })

    test("it reopens on the screen that it was on when it closed", async () => {

        const db = (await databaseFromFileAsync(":memory:")).forceGet()

        const navigationStateRepository = (await buildDatabaseNavigationStateRepository(db))
            .forceGet();

        const screen = render(<AppEntry navigationStateRepository={navigationStateRepository}/>);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()

        screen.unmount();

        const secondScreen = render(<AppEntry navigationStateRepository={navigationStateRepository}/>);

        await validateTripHistoryScreen(secondScreen)
    })

    describe("Trip History screen", () => {
        it("renders the origin, start time and duration of the trip", async () => {
            const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();
            const repository = navigationStateRepositoryController.getRepository();

            const initialScreen = render(<AppEntry navigationStateRepository={repository}/>);

            const homeScreen = await validateHomeScreen(initialScreen);

            const {screen} = await homeScreen.viewPastTrips()

            const rows = await screen.findAllByTestId("row")

            const firstRow = within(rows[0]);
            expect(await firstRow.findByText("2024.01.02 8:00")).toBeOnTheScreen()
            expect(await firstRow.findByText("Home")).toBeOnTheScreen()
            expect(await firstRow.findByText("27:15")).toBeOnTheScreen()

            const secondRow = within(rows[1]);
            expect(await secondRow.findByText("2024.01.01 8:00")).toBeOnTheScreen()
            expect(await secondRow.findByText("Home")).toBeOnTheScreen()
            expect(await secondRow.findByText("30:00")).toBeOnTheScreen()
        })
    })
})
