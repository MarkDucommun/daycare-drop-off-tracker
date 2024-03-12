import '@testing-library/react-native/extend-expect';
import {AppEntry} from "../AppEntry";
import {render} from "@testing-library/react-native";
import {validateHomeScreen, validateTripHistoryScreen} from "./actions";
import {buildInMemoryNavigationStateRepository} from "../navigation/InMemoryNavigationStateRepository";
import {buildDatabaseNavigationStateRepository} from "../navigation/SQLiteNavigationStateRepository";
import {databaseFromFileAsync} from "../utilities/database/BetterSQLiteDatabaseAccess";

// TODO use database access through better-sqlite3
jest.mock("../navigation/nativeStack", () => jest.requireActual('../navigation/stack'))

describe("App startup journey", () => {

    test("it can navigate to the Trip History screen from the Home screen", async () => {

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry navigationStateRepository={navigationStateRepositoryController.getRepository()}/>);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()
    })

    test("it can navigate back to Home from Trip History", async () => {

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const screen = render(<AppEntry navigationStateRepository={navigationStateRepositoryController.getRepository()}/>);

        const homeScreen = await validateHomeScreen(screen);

        const tripHistoryScreen = await homeScreen.viewPastTrips()

        await tripHistoryScreen.goBack("Home", validateHomeScreen);
    })

    test("it reopens on the screen that it was on when it closed", async () => {

        const db = (await databaseFromFileAsync(":memory:")).forceGet()

        const navigationStateRepository = (await buildDatabaseNavigationStateRepository(db))
            .doOnError((e) => console.error(e))
            .forceGet();

        const navigationStateRepositoryController = buildInMemoryNavigationStateRepository();

        const repository = navigationStateRepositoryController.getRepository();

        const screen = render(<AppEntry navigationStateRepository={navigationStateRepository}/>);

        const homeScreen = await validateHomeScreen(screen);

        await homeScreen.viewPastTrips()

        screen.unmount();

        const secondScreen = render(<AppEntry navigationStateRepository={navigationStateRepository}/>);

        await validateTripHistoryScreen(secondScreen)
    })
})
