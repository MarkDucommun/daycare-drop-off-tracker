import '@testing-library/react-native/extend-expect';
import {AppEntry} from "../AppEntry";
import {act, fireEvent, render, within} from "@testing-library/react-native";
import {validateHomeScreen, validateTripHistoryScreen} from "./actions";
import {buildInMemoryNavigationStateRepository} from "../navigation/InMemoryNavigationStateRepository";
import {buildDatabaseNavigationStateRepository} from "../navigation/SQLiteNavigationStateRepository";
import {databaseFromFileAsync} from "../utilities/database/BetterSQLiteDatabaseAccess";
import {buildDatabaseTripStateRepository} from "../trips/FakeTripStateRepository";
import {createControllableTimeProvider} from "../utilities/time/TimeProvider";

jest.mock("../navigation/nativeStack", () => jest.requireActual('../navigation/stack'))

describe("App startup journey", () => {

    test("it can navigate to the Trip History screen from the Home screen", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()
        const tripStateRepository = (await buildDatabaseTripStateRepository(db))
            .forceGet();

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepositoryController.getRepository()}
            tripStateRepository={tripStateRepository}
        />);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()
    })

    test("it can navigate to the Trip Tracker screen from the Home screen", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()
        const tripStateRepository = (await buildDatabaseTripStateRepository(db))
            .forceGet();

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepositoryController.getRepository()}
            tripStateRepository={tripStateRepository}
        />);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewTripTracker()
    })

    // TODO move to Trip History block
    test("it can navigate back to Home from Trip History", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()
        const tripStateRepository = (await buildDatabaseTripStateRepository(db))
            .forceGet();

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();


        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepositoryController.getRepository()}
            tripStateRepository={tripStateRepository}
        />);

        const homeScreen = await validateHomeScreen(screen);

        const tripHistoryScreen = await homeScreen.viewPastTrips()

        await tripHistoryScreen.goBack("Home", validateHomeScreen);
    })

    test("it reopens on the screen that it was on when it closed", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()
        const tripStateRepository = (await buildDatabaseTripStateRepository(db))
            .forceGet();

        const navigationStateRepository = (await buildDatabaseNavigationStateRepository(db))
            .forceGet();

        const screen = render(<AppEntry
            navigationStateRepository={navigationStateRepository}
            tripStateRepository={tripStateRepository}
        />);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()

        screen.unmount();

        const secondScreen = render(<AppEntry
            navigationStateRepository={navigationStateRepository}
            tripStateRepository={tripStateRepository}
        />);

        await validateTripHistoryScreen(secondScreen)
    })

    describe("Trip History screen", () => {
        it("renders the origin, start time and duration of the trip", async () => {
            const db = (await databaseFromFileAsync(":memory:")).forceGet()
            const tripStateRepository = (await buildDatabaseTripStateRepository(db))
                .forceGet();

            const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();
            const repository = navigationStateRepositoryController.getRepository();

            const currentDate = new Date(2024, 0, 2, 8, 27, 15);

            const {timeProvider} = createControllableTimeProvider(currentDate.getTime())

            const initialScreen = render(<AppEntry
                navigationStateRepository={repository}
                tripStateRepository={tripStateRepository}
                timeProvider={timeProvider}
            />);

            const homeScreen = await validateHomeScreen(initialScreen);

            const {screen} = await homeScreen.viewPastTrips()

            const rows = await screen.findAllByTestId("row")

            const firstRow = within(rows[0]);
            expect(await firstRow.findByText("2024.01.02 08:00")).toBeOnTheScreen()
            expect(await firstRow.findByText("Home")).toBeOnTheScreen()
            expect(await firstRow.findByText("27m 15s")).toBeOnTheScreen()

            const secondRow = within(rows[1]);
            expect(await secondRow.findByText("2024.01.01 08:00")).toBeOnTheScreen()
            expect(await secondRow.findByText("Home")).toBeOnTheScreen()
            expect(await secondRow.findByText("30m")).toBeOnTheScreen()
        })

        it("updates the duration of active trips in real time", async () => {
            const db = (await databaseFromFileAsync(":memory:")).forceGet()
            const tripStateRepository = (await buildDatabaseTripStateRepository(db))
                .forceGet();

            const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();
            const repository = navigationStateRepositoryController.getRepository();

            const currentDate = new Date(2024, 0, 2, 8, 27, 15);

            const {timeProvider, timeController} = createControllableTimeProvider(currentDate.getTime())

            const initialScreen = render(<AppEntry
                navigationStateRepository={repository}
                tripStateRepository={tripStateRepository}
                timeProvider={timeProvider}
            />);

            const homeScreen = await validateHomeScreen(initialScreen);

            const {screen} = await homeScreen.viewPastTrips()

            const firstRow = within((await screen.findAllByTestId("row"))[0]);

            expect(await firstRow.findByText("27m 15s")).toBeOnTheScreen()

            await act(async () => {
                timeController.setNow(new Date(2024, 0, 2, 8, 27, 30).getTime())
                timeController.executeInterval()
            })

            expect(await firstRow.findByText("27m 30s")).toBeOnTheScreen()
        })
    })

    describe("Trip Tracker Screen", () => {
        it("renders an Origin text field when no Origins have yet been entered", async () => {
            const db = (await databaseFromFileAsync(":memory:")).forceGet()
            const tripStateRepository = (await buildDatabaseTripStateRepository(db))
                .forceGet();

            const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();
            const repository = navigationStateRepositoryController.getRepository();

            const initialScreen = render(<AppEntry
                navigationStateRepository={repository}
                tripStateRepository={tripStateRepository}
            />);

            const homeScreen = await validateHomeScreen(initialScreen);

            const {screen} = await homeScreen.viewTripTracker()

            const locationInput = await screen.findByPlaceholderText("Origin location name");

            expect(locationInput).toBeOnTheScreen()

            const createLocationButton = await screen.findByText("Create location")

            expect(createLocationButton).toBeOnTheScreen()
        })

        it("can submit a new Origin location field when no Origins have yet been entered", async () => {
            const db = (await databaseFromFileAsync(":memory:")).forceGet()
            const tripStateRepository = (await buildDatabaseTripStateRepository(db))
                .forceGet();

            const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();
            const repository = navigationStateRepositoryController.getRepository();

            const initialScreen = render(<AppEntry
                navigationStateRepository={repository}
                tripStateRepository={tripStateRepository}
            />);

            const homeScreen = await validateHomeScreen(initialScreen);

            const {screen, goBack} = await homeScreen.viewTripTracker()

            const locationInput = await screen.findByPlaceholderText("Origin location name");

            await act(async () => {
                fireEvent.changeText(locationInput, "Daycare");
            })

            await act(async () => {
                await new Promise(resolve => setTimeout(resolve, 1000))
            })

            const createLocationButton = await screen.findByText("Create location")

            await act(async () => {
                fireEvent.press(createLocationButton);
                await new Promise(resolve => setTimeout(resolve, 100))
            })

            const startButton = await screen.findByText("Start trip")

            expect(startButton).toBeOnTheScreen()

            await goBack("Home", validateHomeScreen)

            const nextScreen = render(<AppEntry
                navigationStateRepository={repository}
                tripStateRepository={tripStateRepository}
            />);

            const {viewPastTrips} = await validateHomeScreen(nextScreen)

            const tripHistoryScreen = await viewPastTrips();

            const rows = await tripHistoryScreen.screen.findAllByTestId("row")

            const lastTrip = within(rows[0])

            expect(await lastTrip.findByText("Daycare")).toBeOnTheScreen()

            expect(await lastTrip.queryByText(RegExp(/[0-9]+m [0-9]+s/))).not.toBeOnTheScreen()
        })
    })
})
