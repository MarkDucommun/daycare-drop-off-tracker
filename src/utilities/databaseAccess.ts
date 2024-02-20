import * as SQLite from "expo-sqlite";
import {failure, Result, success} from "./results";
import {ResultSet, SQLStatementArg} from "expo-sqlite";
import {createLogger, Logger} from "./logger";

export type Row = { [column: string]: any }

export type ExecuteSQL = (sql: string, args?: (string | number | null)[]) => Promise<Result<string, ResultSet>>

export type TransactionCreator = <T>(fn: InTransaction<T>, logger?: Logger) => Promise<Result<string, T>>

export type InTransaction<T> = (executor: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>

const databaseAccessLogger = createLogger("databaseAccess")

export const createTransactionCreator = (database: SQLite.SQLiteDatabase, logger: Logger = databaseAccessLogger): TransactionCreator => {
    return <T>(fn: (executor: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>, transactionLogger: Logger = databaseAccessLogger) =>
        new Promise<Result<string, T>>(async (resolve) => {
            const onRollback: Array<() => void> = []
            let result: Result<string, T> | null = null
            try {
                await database.transactionAsync(async tx => {
                    result = await fn(createSqlExecutor(tx, transactionLogger), (rollbackFn) => onRollback.push(rollbackFn));

                    result.doOnError((e) => {
                        throw Error(e)
                    });
                });
            } catch (e: any) {
                onRollback.forEach(it => it())
                if (!result) {
                    result = 'message' in e ?
                        failure(e.message) :
                        failure<string, T>("Error reading database when selecting last trip");
                }
            }
            if (result != null) resolve(result)
            else resolve(failure("something went wrong"))
        });
}

export function createSqlExecutor(tx: SQLite.SQLTransactionAsync, logger: Logger): ExecuteSQL {
    return async (sql, args) => {
        try {
            logger.trace("Executing SQL: " + sql)
            logger.trace("With Args:" + args)
            const resultSet = await tx.executeSqlAsync(sql, args as SQLStatementArg[]);
            logger.trace("Results:")
            logger.trace(resultSet)
            return success(resultSet)
        } catch (e: any) {
            return 'message' in e ? failure(e.message) : failure<string, ResultSet>("Error executing SQL");
        }
    }
}
