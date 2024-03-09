import * as SQLite from "expo-sqlite";
import {ResultSet, SQLStatementArg} from "expo-sqlite";
import {failure, flatMapAsync, map, Result, safelyExecute, success, toNull} from "./results";
import {createLoggerFromParent, Logger} from "./logger";

export type Row = { [column: string]: any }

export type ExecuteSQL = (sql: string, args?: (string | number | null)[]) => Promise<Result<string, ResultSet>>

export type TransactionCreator = <T>(fn: InTransaction<T>, logger?: Logger) => Promise<Result<string, T>>

export type PushOnRollback = (fn: () => void) => void

export type InTransaction<T> = (executor: ExecuteSQL, pushOnRollback: PushOnRollback, logger: Logger) => Promise<Result<string, T>>

export const createTransactionCreatorForFile = (databaseFile: string, parentLogger?: Logger): Result<string, TransactionCreator> =>
    safelyExecute(() => SQLite.openDatabase(databaseFile))
        .map(createTransactionCreator(parentLogger))

export const createTransactionCreator = (parentLogger?: Logger) => (database: SQLite.SQLiteDatabase, ): TransactionCreator => {

    const databaseAccessLogger = createLoggerFromParent(parentLogger)("db")

    return <T>(fn: (executor: ExecuteSQL, pushOnRollback: PushOnRollback, logger: Logger) => Promise<Result<string, T>>, parentTransactionLogger: Logger = databaseAccessLogger) => {

        const transactionLogger = parentTransactionLogger.createChild("transaction")
        return new Promise<Result<string, T>>(async (resolve) => {
            const onRollback: Array<() => void> = []
            let result: Result<string, T> | null = null
            try {
                await database.transactionAsync(async tx => {
                    result = await fn(createSqlExecutor(tx, transactionLogger), (rollbackFn) => onRollback.push(rollbackFn), transactionLogger);

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

export type SimpleMigration = (...sql: string[]) => InTransaction<null>

export const simpleMigration: SimpleMigration = (...sql) => (execute, _, logger) => {
    return sql.reduce((previousValue, currentValue, currentIndex, array) => {
        return previousValue
            .then(flatMapAsync(_ => execute(currentValue)))
            .then(map(toNull))
    }, Promise.resolve(success<string, null>(null)))
}
