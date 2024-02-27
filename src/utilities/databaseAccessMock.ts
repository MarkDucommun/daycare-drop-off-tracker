import * as SQLite from "expo-sqlite";
import {ResultSet, SQLStatementArg} from "expo-sqlite";
import {createLoggerFromParent, Logger} from "./logger";
import {failure, Result, success} from "./results";
import {ExecuteSQL, PushOnRollback, Row, TransactionCreator} from "./databaseAccess";
import {Database as BetterDatabase} from "better-sqlite3";

export const createTransactionCreator = (database: BetterDatabase, parentLogger?: Logger): TransactionCreator => {

    const databaseAccessLogger = createLoggerFromParent(parentLogger)("db")

    return <T>(fn: (executor: ExecuteSQL, pushOnRollback: PushOnRollback, logger: Logger) => Promise<Result<string, T>>, parentTransactionLogger: Logger = databaseAccessLogger) => {

        const transactionLogger = parentTransactionLogger.createChild("transaction")

        return new Promise<Result<string, T>>(async (resolve) => {
            const onRollback: Array<() => void> = []
            let result: Result<string, T> | null = null
            try {
                const transaction = database.transaction(async (tx) => {

                    const resultSet: ResultSet = {insertId: 0, rows: [], rowsAffected: 0}

                    const executor: ExecuteSQL = (sql) => {
                        const stmt = database.prepare(sql)

                        const isRunError = (e: any) => {
                            const useRunMessage = "This statement does not return data. Use run() instead"
                            return typeof e === 'object' && 'message' in e && e.message === useRunMessage
                        }

                        try {
                            const results1 = stmt.all()

                            const rows = results1
                                .filter((row: any): row is Row => typeof row === 'object')

                            return Promise.resolve(success({...resultSet, rows}))
                        } catch (e: any) {

                            if (!isRunError(e)) return Promise.resolve(failure(e))
                        }

                        try {
                            const results1 = stmt.run()
                            const insertId = results1.lastInsertRowid;
                            if (typeof insertId === 'bigint') return Promise.resolve(failure("Insert ID is a bigint, not supported"))

                            const value: ResultSet = {...resultSet, rowsAffected: results1.changes, insertId: insertId};
                            return Promise.resolve(success(value))
                        } catch (e) {
                            console.log(e)
                        }

                        console.log(sql);
                        return Promise.resolve(failure("Error executing SQL"));
                    }

                    const pushOnRollback: PushOnRollback = (f) => {
                        onRollback.push(f)
                    };
                    result = await fn(executor, pushOnRollback, transactionLogger);
                });

                const resultsa = await transaction([])

                console.log()

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
    };
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
