import {CreateDatabaseFromFileAsync, DatabaseAccess, RunResult, Statement} from "./DatabaseTypes";
import {failure, success} from "../results/successAndFailure";
import {AsyncResult} from "../results/results";
import * as SQLite from "expo-sqlite/next";
import {flatMapAsync, map} from "../results/resultCurriers";
import {safelyExecute, safelyExecuteAsync, toNull} from "../results/otherTransforms";

export const databaseFromFileAsync: CreateDatabaseFromFileAsync = async (path) => {

    const dbResult = await openDatabaseAsync(path)

    if (dbResult.type === 'failure') return failure("TODO")

    const db = dbResult.value

    return success({
        execAsync: executeAsync(db),
        execSync: executeSync(db),
        runAsync: runAsync(db),
        runSync: runSync(db),
        prepareSync: prepareSync(db),
        prepareAsync: prepareAsync(db)
    })
}

function openDatabaseAsync(path: string): AsyncResult<SQLite.SQLiteDatabase> {
    return safelyExecuteAsync(() => SQLite.openDatabaseAsync(path))
}

function executeAsync(database: SQLite.SQLiteDatabase): DatabaseAccess['execAsync'] {
    return async (sql) => safelyExecuteAsync(() => database.execAsync(sql)).then(map(toNull))
}
function executeSync(database: SQLite.SQLiteDatabase): DatabaseAccess['execSync'] {
    return (sql) => safelyExecute(() => database.execSync(sql)).map(toNull)
}

function runAsync(database: SQLite.SQLiteDatabase): DatabaseAccess['runAsync'] {
    return (sql, params) => safelyExecuteAsync(() => database.runAsync(sql, params))
            .then(map(runResultFromSQLite))
}

function runSync(database: SQLite.SQLiteDatabase): DatabaseAccess['runSync'] {
    return (sql, params) => safelyExecute(() => database.runSync(sql, params))
        .map(runResultFromSQLite)
}

function  runResultFromSQLite<T extends {lastInsertRowId: number, changes: number}>(result: T): RunResult {
    return {lastInsertId: result.lastInsertRowId, changes: result.changes}
}

function prepareAsync(database: SQLite.SQLiteDatabase): DatabaseAccess['prepareAsync'] {
    return async (sql) =>
        safelyExecuteAsync(() => database.prepareAsync(sql))
            .then(map(constructStatement))
}

function prepareSync(database: SQLite.SQLiteDatabase): DatabaseAccess['prepareSync'] {
    return (sql) => safelyExecute(() => database.prepareSync(sql))
            .map(constructStatement)
}

function constructStatement(statement: SQLite.SQLiteStatement): Statement {
    return {
        getFirstSync: getFirstSync(statement),
        getFirstAsync: getFirstAsync(statement),
        getAllSync: getAllSync(statement),
        getAllAsync: getAllAsync(statement),
        executeAsync: execAsync(statement),
        executeSync: execSync(statement),
        finalizeSync: finalizeSync(statement),
        finalizeAsync: finalizeAsync(statement)
    }
}

function getFirstAsync(statement: SQLite.SQLiteStatement): Statement['getFirstAsync'] {
    return (params) => safelyExecuteAsync(() => statement.executeAsync(params))
        .then(flatMapAsync((result) => safelyExecuteAsync(result.getFirstAsync)))
}

function getFirstSync(statement: SQLite.SQLiteStatement): Statement['getFirstSync'] {
    return (params) => safelyExecute(() => statement.executeSync(params))
        .flatMap((result) => safelyExecute(result.getFirstSync))
}

function getAllAsync(statement: SQLite.SQLiteStatement): Statement['getAllAsync'] {
    return (params) => safelyExecuteAsync(() => statement.executeAsync(params))
        .then(flatMapAsync((result) => safelyExecuteAsync(result.getAllAsync)))
}

function getAllSync(statement: SQLite.SQLiteStatement): Statement['getAllSync'] {
    return (params) => safelyExecute(() => statement.executeSync(params))
        .flatMap((result) => safelyExecute(result.getAllSync))
}

function execAsync(statement: SQLite.SQLiteStatement): Statement['executeAsync'] {
    return (params) => safelyExecuteAsync(() => statement.executeAsync(params))
        .then(map(runResultFromSQLite))
}

function execSync(statement: SQLite.SQLiteStatement): Statement['executeSync'] {
    return (params) => safelyExecute(() => statement.executeSync(params))
        .map(runResultFromSQLite)
}

function finalizeAsync(statement: SQLite.SQLiteStatement): Statement['finalizeAsync'] {
    return async () => safelyExecuteAsync(() => statement.finalizeAsync()).then(map(toNull))
}

function finalizeSync(statement: SQLite.SQLiteStatement): Statement['finalizeSync'] {
    return () => safelyExecute(() => statement.finalizeSync()).map(toNull)
}
