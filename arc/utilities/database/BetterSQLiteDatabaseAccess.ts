import {CreateDatabaseFromFileAsync, DatabaseAccess, Statement} from "./DatabaseTypes";
import {failure, success} from "../results/successAndFailure";
import {AsyncResult} from "../results/results";
import {safelyExecute, toNull} from "../results/otherTransforms";
import Database, {Database as DatabaseType, Statement as StatementType} from "better-sqlite3";
import {todo} from "../results/resultCurriers";

export const databaseFromFileAsync: CreateDatabaseFromFileAsync = async (path) => {

    const dbResult = await openDatabaseAsync(path)

    if (dbResult.type === 'failure') return failure("TODO")

    const db = dbResult.value

    return success({
        execAsync: executeAsync(db),
        execSync: executeSync(db),
        runAsync: runAsync(db),
        runSync: runSync(db),
        prepareAsync: prepareAsync(db),
        prepareSync: prepareSync(db)
    })
}

async function openDatabaseAsync(path: string): AsyncResult<DatabaseType> {
    return safelyExecute(() => Database(path))
}

function executeAsync(database: DatabaseType): DatabaseAccess['execAsync'] {
    return async (sql) => executeSync(database)(sql)
}

function executeSync(database: DatabaseType): DatabaseAccess['execSync'] {
    return (sql) => safelyExecute(() => database.exec(sql)).map(toNull)
}

function runAsync(database: DatabaseType): DatabaseAccess['runAsync'] {
    return async (sql, params) => runSync(database)(sql, params)
}

function runSync(database: DatabaseType): DatabaseAccess['runSync'] {
    return (sql, params) => safelyExecute(() => database.prepare(sql).run(params))
        .flatMap((a) => typeof a.lastInsertRowid === "bigint" ?
            failure("cannot handle bigints") :
            success({lastInsertId: a.lastInsertRowid, changes: a.changes}))
}

function prepareAsync(database: DatabaseType): DatabaseAccess['prepareAsync'] {
    return async (sql) => prepareSync(database)(sql)
}

function prepareSync(database: DatabaseType): DatabaseAccess['prepareSync'] {

    return (sql) => {

        const prepareResult = safelyExecute(() => database.prepare(sql));

        if (prepareResult.type == "failure") return failure(prepareResult.error)

        const rawStatement = database.prepare(sql);

        const statement: Statement = {
            getFirstSync: getFirstSync(rawStatement),
            getFirstAsync: getFirstAsync(rawStatement),
            getAllSync: getAllSync(rawStatement),
            getAllAsync: getAllAsync(rawStatement),
            executeSync: execSync(rawStatement),
            executeAsync: execAsync(rawStatement),
            finalizeSync: finalizeSync(rawStatement),
            finalizeAsync: finalizeAsync(rawStatement)
        }

        return success(statement)
    }
}

function getFirstAsync(statement: StatementType): Statement['getFirstAsync'] {
    return async (params) => getFirstSync(statement)(params)
}

function getFirstSync(statement: StatementType): Statement['getFirstSync'] {
    return (params) => safelyExecute(() => statement.get(params))
}

function getAllAsync(statement: StatementType): Statement['getAllAsync'] {
    return async (params) => getAllSync(statement)(params)
}

function getAllSync(statement: StatementType): Statement['getAllSync'] {
    return (params) => safelyExecute(() => statement.all(params))
}

function execAsync(statement: StatementType): Statement['executeAsync'] {
    return async (params) => execSync(statement)(params)
}

function execSync(statement: StatementType): Statement['executeSync'] {
    return (params) => safelyExecute(() => statement.run(params))
        .flatMap((a) => typeof a.lastInsertRowid === "bigint" ?
            failure("") :
            success({lastInsertId: a.lastInsertRowid, changes: a.changes}))
}

function finalizeAsync(statement: StatementType): Statement['finalizeAsync'] {
    return async () => finalizeSync(statement)()
}

function finalizeSync(statement: StatementType): Statement['finalizeSync'] {
    return () => success(null)
}
