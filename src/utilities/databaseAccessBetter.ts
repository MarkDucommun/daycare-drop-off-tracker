import * as SQLite from "expo-sqlite";
import {ResultSet, SQLStatementArg} from "expo-sqlite";
import {AsyncResult, convertPromise, failure, failureIfTruthy, map, Result, success} from "./results";
import {createLoggerFromParent, Logger} from "./logger";

export type Row = { [column: string]: any }

type Executor = (sql: string, ...args: (string | number | null)[]) => ResultParser

type ResultParser = {
    single: () => AsyncResult<Row | null>
    all: () => AsyncResult<Row[]>
    run: () => AsyncResult<RunResult>
}

type RunResult = {
    insertId: number | null
    changes: number
}

export type TransactionCreator = <T>(fn: InTransaction<T>, logger?: Logger) => Promise<Result<string, T>>

export type InTransaction<T> = (executor: Executor, logger: Logger) => Promise<Result<string, T>>

export const createTransactionCreator = (database: SQLite.SQLiteDatabase, parentLogger?: Logger): TransactionCreator =>
    (fn, parentTransactionLogger = parentLogger) =>
        new Promise(async (resolve) => {

            const transactionLogger = createLoggerFromParent(parentTransactionLogger)("db")

            try {
                await database.transactionAsync(async tx => {
                    resolve(await fn(createSqlExecutor(tx, transactionLogger), transactionLogger));
                });
            } catch (e: any) {
                resolve('message' in e ? failure(e.message) : failure("Error in database transaction"))
            }
        })

export const createSqlExecutor = (tx: SQLite.SQLTransactionAsync, logger: Logger): Executor =>
    (sql, ...args) => {

        logger.trace("Executing SQL: " + sql)
        logger.trace("With Args:" + args)

        const resultPromise = tx.executeSqlAsync(sql, args as SQLStatementArg[])

        return {
            single: () => convertPromise(resultPromise)
                .then(failIfRowsAffected)
                .then(failIfMoreThanOneRowReturned)
                .then(map(resultSetToRow)),
            all: () => convertPromise(resultPromise)
                .then(failIfRowsAffected)
                .then(map(resultSetToRows)),
            run: () => convertPromise(resultPromise)
                .then(failIfRowsReturned)
                .then(map(resultSetToRunResult))
        }
    }

const resultSetToRunResult = ({rowsAffected, insertId}: ResultSet): RunResult =>
    ({insertId: insertId ?? null, changes: rowsAffected})

const resultSetToRows = ({rows}: ResultSet): Row[] => rows

const resultSetToRow = ({rows}: ResultSet): Row | null => rows.length == 0 ? null : rows[0]

type ResultCheck = (result: Result<string, ResultSet>) => Result<string, ResultSet>

const failIfRowsAffected: ResultCheck = failureIfTruthy(
    ({rowsAffected}) => rowsAffected > 0,
    "Expected no rows to be changed, please use run")

const failIfRowsReturned: ResultCheck = failureIfTruthy(
    ({rows}) => rows.length > 0,
    "Expected no rows to be returned")

const failIfMoreThanOneRowReturned: ResultCheck = failureIfTruthy(
    ({rows}) => rows.length > 1,
    "Expected one row, got more than one - please use all")
