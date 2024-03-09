import {createLogger} from "../../../utilities/logger";
import {createTransactionCreator, createTransactionCreatorForFile} from "../../../utilities/databaseAccessMock";
import {createRawTripRepository} from "../rawTripRepository";
import Database from "better-sqlite3";

describe('GetRawTripOverviews', () => {
    test('can retrieve trips', async () => {
        const logger = createLogger('test', 'DEBUG');

        const filename = "/Users/mducommun/Library/CloudStorage/OneDrive-VMware,Inc/workspace/daycare-dropoff-tracker/src/trips/persistence/__tests__/tripManager.db";
        const database = Database(filename, { readonly: true })

        createTransactionCreator(logger)(database)

        const rawTripRepository = createRawTripRepository(logger)(createTransactionCreator(logger)(database));

        const trips = (await rawTripRepository.getRawTripOverviews()).forceGet();

        console.log(trips)
    })
})
