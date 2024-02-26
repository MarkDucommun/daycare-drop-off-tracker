import {fireEvent, render} from "@testing-library/react-native";
import {Loading} from "../src/screens/ScreenNavigator";
import React from "react";
import AppNavigator from "../src/AppNavigator";
import {rawScreenRepository} from "../src/screens/persistence/sqliteRawScreenRepository";
import '@testing-library/react-native/extend-expect';
import {createLogger} from "../src/utilities/logger";

jest.mock("../src/screens/persistence/sqliteRawScreenRepository", () => {
    return jest.requireActual('../src/screens/persistence/fakeRawScreenRepository')
})

jest.mock("../src/trips/persistence/sqliteRawTripRepository", () => {
    return jest.requireActual('../src/screens/persistence/fakeRawTripRepository')
})

describe("Can run the whole App without the database", () => {
    test("Loading - ", async () => {

        rawScreenRepository()
        const loading = render(<Loading/>)

        expect(loading).toBeOnTheScreen()

        expect(await loading.findByText("....Loading......")).toBeOnTheScreen()
    })

    test("AppNavigator", async () => {
        const logger = createLogger("test", "TRACE")

        const appNavigator = render(<AppNavigator parentLogger={logger}/>);

        const tripRunnerButton = await appNavigator.findByText("Trip Runner")

        expect(await appNavigator.findByText("Database Tests")).toBeOnTheScreen()

        fireEvent.press(tripRunnerButton)

        expect(await appNavigator.findByText("At Trip Runner")).toBeOnTheScreen()
    })
})
