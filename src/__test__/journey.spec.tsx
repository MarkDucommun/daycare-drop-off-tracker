import {act, fireEvent, render, waitFor} from "@testing-library/react-native";
import React from "react";
import AppNavigator from "../AppNavigator";
import '@testing-library/react-native/extend-expect';
import {createLogger, Logger} from "../utilities/logger";
import {createTransactionCreatorForFile} from "../utilities/databaseAccessMock";
import {forceGet} from "../utilities/results";
import {createRawTripRepository} from "../trips/persistence/rawTripRepository";
import {buildTripRepository} from "../trips/persistence/tripRepository";
import {buildScreenRepository} from "../navigation/screenRepository";
import {createRawScreenRepositoryToo} from "../navigation/persistence/rawScreenRepository";
import {Loading} from "../navigation/Loading";
import {AccelerationRepository} from "../acceleration/persistence/AccelerationRepository";

jest.mock("../utilities/databaseAccess", () => {
    return jest.requireActual('../src/utilities/databaseAccessMock')
})

jest.mock("../navigation/nativeStackProvider", () => {
    return jest.requireActual('../src/navigation/stackProvider')
})

const createMemoryTripRepository = async (parentLogger?: Logger) =>
    createTransactionCreatorForFile(":memory:", parentLogger)
        .map(createRawTripRepository(parentLogger))
        .flatMapAsync(buildTripRepository)

const createMemoryScreenRepository = async (parentLogger?: Logger) =>
    createTransactionCreatorForFile(":memory:", parentLogger)
        .map(createRawScreenRepositoryToo(parentLogger))
        .flatMapAsync(buildScreenRepository)

describe("Can run the whole App without the database", () => {
    test("Loading - ", async () => {

        const loading = render(<Loading/>)

        expect(await loading.findByText("....Loading......")).toHaveTextContent("....Loading......")
    })

    test("AppNavigator", async () => {
        const logger = createLogger("test", "TRACE")

        const appNavigator = render(<AppNavigator
            parentLogger={logger}
            tripRepository={forceGet(await createMemoryTripRepository(logger))}
            screenRepository={forceGet(await createMemoryScreenRepository(logger))}
            accelerationRepository={{} as unknown as AccelerationRepository}
        />);

        const tripRunnerButton = await appNavigator.findByText("Trip Runner")

        expect(await appNavigator.findByText("Database Tests")).toBeOnTheScreen()

        fireEvent.press(tripRunnerButton)

        const selectOrigin = await appNavigator.findByText("Select Origin");

        expect(selectOrigin).toBeOnTheScreen()

        await act(async () => {

            const backButton = await appNavigator.findByText('menu');

            fireEvent.press(backButton)

            expect(await appNavigator.findByText("Trip Runner")).toBeOnTheScreen()

            const lastTripSummary = await appNavigator.findByText("Last Trip Summary")
            console.log(lastTripSummary)

            fireEvent.press(lastTripSummary)
        })

        await waitFor(async () => {

            const lastTripSummary = await appNavigator.findByText("Last Trip Summary Screen")

            expect(lastTripSummary).toBeOnTheScreen()
        })

    })

    test("other", async () => {
        const logger = createLogger("test", "TRACE")

        const tripTxCreator = createTransactionCreatorForFile(":memory:", logger);
        const screenTxCreator = createTransactionCreatorForFile(":memory:", logger);

        const appNavigator = render(<AppNavigator
            parentLogger={logger}
            tripRepository={forceGet(await createMemoryTripRepository(logger))}
            screenRepository={forceGet(await createMemoryScreenRepository(logger))}
            accelerationRepository={{} as unknown as AccelerationRepository}
        />);

        const lastTripSummary = await appNavigator.findByText("Last Trip Summary")

        fireEvent.press(lastTripSummary)

        await waitFor(async () => {

            const lastTripSummaryScreen = await appNavigator.findByText("Last Trip Summary Screen")

            expect(lastTripSummaryScreen).toBeOnTheScreen()
        })
    })

// TODO pressing new trip should get a new trip, not the last trip
})
