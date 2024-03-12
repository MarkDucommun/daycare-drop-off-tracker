import {CreateDatabaseFromFileAsync, DatabaseAccess, RunResult} from "./DatabaseTypes";
import {failure, success} from "../results/successAndFailure";
import {AsyncResult} from "../results/results";
import * as SQLite from "expo-sqlite/next";
import {map} from "../results/resultCurriers";
import {safelyExecute, safelyExecuteAsync, toNull} from "../results/otherTransforms";

export const databaseFromFileAsync: CreateDatabaseFromFileAsync = async (path) => {

    const dbResult = await openDatabaseAsync(path)

    if (dbResult.type === 'failure') return failure("TODO")

    const db = dbResult.value

    return success({
        execAsync: executeAsync(db),
        execSync: executeSync(db),
        runAsync: runAsync(db),
        runSync: runSync(db)
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
