import {createLoggerFromParent, Logger} from "../../utilities/logger";
import {ensureLengthOfOneAndExtract, flatMap, Result, success} from "../../utilities/results";
import {ResultSet, SQLiteDatabase} from "expo-sqlite";
import {createTransactionCreator, InTransaction, TransactionCreator} from "../../utilities/databaseAccess";
import {ensureScreenTableExists} from "./screenMigration";
import {ScreenData, ScreenNameWithVersion} from "../screenTypes";
import {extractRowsDataForType} from "../../utilities/rowMapper";

export type RawScreenRepository = {
    setup: (parentLogger?: Logger) => Promise<Result<string, null>>
    saveScreenNameTransaction: CreateSaveScreenNameTransaction
    getCurrentScreen: GetCurrentScreenNameToo
}

export type BuildRawScreenRepository = (parentLogger?: Logger) => (transactionCreator: TransactionCreator) => RawScreenRepository

type GetCurrentScreenNameToo = (parentLogger?: Logger) => Promise<Result<string, ScreenData>>

type CreateSaveScreenNameTransaction =  (parentLogger?: Logger) => Promise<Result<string, RawSaveScreenNameTransaction>>

export type RawSaveScreenNameTransaction = {
    getScreenNameVersions: () => Promise<Result<string, ScreenData>>,
    saveScreenName: (screen: ScreenNameWithVersion) => Promise<Result<string, ResultSet>>
}

export const createRawScreenRepositoryToo: BuildRawScreenRepository = (parentLogger?: Logger) => (transactionCreator: TransactionCreator) => {
    const logger = createLoggerFromParent(parentLogger)("rawScreenRepo")

    return {
        setup: (parentLogger?: Logger) => transactionCreator(ensureScreenTableExists, parentLogger),
        saveScreenNameTransaction: createSaveScreenName(transactionCreator),
        getCurrentScreen: (parentLogger?: Logger) => transactionCreator(getScreenData, parentLogger)
    }
}

// export const createRawScreenRepository = (db: SQLiteDatabase): BuildRawScreenRepository => (parentLogger?: Logger) => {
//     const logger = createLoggerFromParent(parentLogger)("rawScreenRepo")
//     const transactionCreator = createTransactionCreator(db, logger)
//
//     return {
//         setup: (parentLogger?: Logger) => transactionCreator(ensureScreenTableExists, parentLogger),
//         saveScreenNameTransaction: createSaveScreenName(transactionCreator),
//         getCurrentScreen: (parentLogger?: Logger) => transactionCreator(getScreenData, parentLogger)
//     }
// }

const screenRowExtractor = extractRowsDataForType<ScreenData, keyof ScreenData>(
    {key: 'name', type: 'string', nullable: false},
    {key: 'version', type: 'number', nullable: false}
);

const getScreenData: InTransaction<ScreenData> = (executor, _, logger) => {
    logger.debug("Getting screen name versions ")
    return executor("SELECT * FROM screen LIMIT 2;")
        .then(flatMap(screenRowExtractor(logger)))
        .then(flatMap(ensureLengthOfOneAndExtract))
}

const createSaveScreenName = (transactionCreator: TransactionCreator): CreateSaveScreenNameTransaction => (parentLogger?: Logger) => {
    parentLogger?.debug("Creating saveScreenName transaction")
    return transactionCreator(async (executor, _, logger) =>
        success<string, RawSaveScreenNameTransaction>({
            getScreenNameVersions: () => getScreenData(executor, _, logger),
            saveScreenName: (screen: ScreenNameWithVersion) => executor("UPDATE screen SET name = ?, version = ?", [screen.name, screen.version])
        }), parentLogger);
};
