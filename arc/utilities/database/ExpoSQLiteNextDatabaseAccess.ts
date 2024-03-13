import {CreateDatabaseFromFileAsync, DatabaseAccess, RunResult, Statement} from "./DatabaseTypes";
import {failure, success} from "../results/successAndFailure";
import {AsyncResult} from "../results/results";
import * as SQLite from "expo-sqlite/next";
import {flatMapAsync, map, todo} from "../results/resultCurriers";
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
    return (sql, params) => {
        return safelyExecuteAsync(() => database.runAsync(sql, params))
            .then(map(runResultFromSQLiteResult))
    }
}

function runSync(database: SQLite.SQLiteDatabase): DatabaseAccess['runSync'] {
    return (sql, params) => safelyExecute(() => database.runSync(sql, params))
        .map(runResultFromSQLiteResult)
}

function runResultFromSQLiteResult(result: SQLite.SQLiteRunResult): RunResult {
    return {lastInsertId: result.lastInsertRowId, changes: result.changes}
}

function prepareAsync(database: SQLite.SQLiteDatabase): DatabaseAccess['prepareAsync'] {
    return async (sql) => {

        const rawStatement = await safelyExecuteAsync(() => database.prepareAsync(sql));

        if (rawStatement.type == "failure") return todo()

        const statement: Statement = {
            getFirstSync: getFirstSync(rawStatement.value),
            getFirstAsync: getFirstAsync(rawStatement.value),
            finalizeSync: finalizeSync(rawStatement.value),
            finalizeAsync: finalizeAsync(rawStatement.value)
        }

        return success(statement)
    }
}
function prepareSync(database: SQLite.SQLiteDatabase): DatabaseAccess['prepareSync'] {
    return (sql) => {

        const rawStatement = safelyExecute(() => database.prepareSync(sql));

        if (rawStatement.type == "failure") return todo()

        const statement: Statement = {
            getFirstSync: getFirstSync(rawStatement.value),
            getFirstAsync: getFirstAsync(rawStatement.value),
            finalizeSync: finalizeSync(rawStatement.value),
            finalizeAsync: finalizeAsync(rawStatement.value)
        }

        return success(statement)
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

function finalizeAsync(statement: SQLite.SQLiteStatement): Statement['finalizeAsync'] {
    return async () => safelyExecuteAsync(() => statement.finalizeAsync()).then(map(toNull))
}

function finalizeSync(statement: SQLite.SQLiteStatement): Statement['finalizeSync'] {
    return () => safelyExecute(() => statement.finalizeSync()).map(toNull)
}
