import * as SQLite from "expo-sqlite";
import {failure, Result, success} from "./results";
import {ResultSet, SQLStatementArg} from "expo-sqlite";

export type Row = { [column: string]: any }

export type ExecuteSQL = (sql: string, args?: (string | number | null)[]) => Promise<Result<string, ResultSet>>

export type Transaction = <T>(fn: InTransaction<T>) => Promise<Result<string, T>>

export type InTransaction<T> = (executor: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>

export const createTransactionCreator = (database: SQLite.SQLiteDatabase): Transaction => {
    return <T>(fn: (executor: ExecuteSQL, pushOnRollback: (fn: () => void) => void) => Promise<Result<string, T>>) =>
        new Promise<Result<string, T>>(async (resolve) => {
            const onRollback: Array<() => void> = []
            let result: Result<string, T> | null = null
            try {
                await database.transactionAsync(async tx => {
                    result = await fn(createSqlExecutor(tx), (rollbackFn) => onRollback.push(rollbackFn));

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

export function createSqlExecutor(tx: SQLite.SQLTransactionAsync): ExecuteSQL {
    return async (sql, args) => {
        try {
            console.log("Executing SQL: " + sql)
            console.log("With Args:" + args)
            const resultSet = await tx.executeSqlAsync(sql, args as SQLStatementArg[]);
            console.log("Results:")
            console.log(resultSet)
            return success(resultSet)
        } catch (e: any) {
            return 'message' in e ? failure(e.message) : failure<string, ResultSet>("Error executing SQL");
        }
    }
}