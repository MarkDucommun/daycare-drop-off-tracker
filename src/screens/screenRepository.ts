import {Screeen} from "./screenManager";
import {flatMap, flatMapAsync, map, Result, successIfTruthy, todo} from "../utilities/results";
import {SQLiteDatabase} from "expo-sqlite";
import {extractCount, extractRowsDataForType} from "../utilities/rowMapper";
import {createTransactionCreator, ExecuteSQL} from "../utilities/databaseAccess";

type ScreenRepository = {
    getCurrentScreen: () => Promise<Result<string, Screeen>> // todo maybe should not fail?
    save: (currentScreen: Screeen) => Promise<Result<string, null>>
}

export type BuildScreenRepository = () => Promise<Result<string, ScreenRepository>>

export const buildDbScreenRepository = (db: SQLiteDatabase): BuildScreenRepository => () => {

    const transactionCreator = createTransactionCreator(db);

    return transactionCreator(ensureScreenTableExists)
        .then(map(_ => {
            return {
                getCurrentScreen: () => transactionCreator(getCurrentScreen),
                save: (currentScreen: Screeen) => transactionCreator(saveScreen(currentScreen))
            }
        }))
}

const screenRowExtractor = extractRowsDataForType<ScreenData, keyof ScreenData>(
    {key: 'name', type: 'string', nullable: false},
    {key: 'version', type: 'number', nullable: false}
);

const getCurrentScreen = async (executor: ExecuteSQL): Promise<Result<string, Screeen>> => {
    executor("SELECT * FROM screen LIMIT 2;")
        .then(flatMap(screenRowExtractor()))
        .then(flatMap(rows => successIfTruthy(rows.length == 1).map(_ => rows[0])))
        .then(flatMap(screen => {

            return todo()
        }))
    // retrieve the current screen from the database
    // convert the result to a Screeen
    return todo()
}

const saveScreen = (currentScreen: Screeen) => async (executor: ExecuteSQL): Promise<Result<string, null>> => {
    // retrieve the current screen from the database
    // ensure the version has not been incremented from the current version
    // if it has, return an error
    // otherwise, update the current screen in the database
    return todo()
}

type ScreenData = {
    name: string,
    version: number
}

const ensureScreenTableExists = (executor: ExecuteSQL) =>
    executor("create table if not exists screen (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, version INTEGER NOT NULL);")
        .then(flatMapAsync(_ => executor("SELECT count(*) FROM screen;")))
        .then(flatMap(extractCount))
        .then(flatMap(rowCount => successIfTruthy(rowCount == 0)))
        .then(flatMapAsync(_ => executor("INSERT INTO screen (name, version) VALUES ('menu', 0)")))
