import {ResultSet} from "expo-sqlite";
import {createLoggerFromParent, Logger} from "./logger";
import {failure, Result, safelyExecute, success} from "./results";
import {ExecuteSQL, PushOnRollback, Row, TransactionCreator} from "./databaseAccess";
import Database, { Database as DatabaseType} from "better-sqlite3";

export const createTransactionCreatorForFile = (databaseFile: string = ":memory:", parentLogger?: Logger): Result<string, TransactionCreator> =>
    safelyExecute(() => Database(databaseFile)).map(createTransactionCreator(parentLogger))


export const createTransactionCreator = (parentLogger?: Logger) => (database: DatabaseType): TransactionCreator => {

    const databaseAccessLogger = createLoggerFromParent(parentLogger)("db")

    databaseAccessLogger.info("Welcome to MOCK DATABASE ACCESS!")

    return <T>(fn: (executor: ExecuteSQL, pushOnRollback: PushOnRollback, logger: Logger) => Promise<Result<string, T>>, parentTransactionLogger: Logger = databaseAccessLogger) => {

        const transactionLogger = parentTransactionLogger.createChild("transaction")

        return new Promise<Result<string, T>>(async (resolve) => {
            const onRollback: Array<() => void> = []
            let result: Result<string, T> | null = null
            try {
                const transaction = database.transaction(async (tx) => {

                    const resultSet: ResultSet = {insertId: 0, rows: [], rowsAffected: 0}

                    const executor: ExecuteSQL = (sql, params) => {
                        const stmt = database.prepare(sql)

                        const isRunError = (e: any) => {
                            const useRunMessage = "This statement does not return data. Use run() instead"
                            return typeof e === 'object' && 'message' in e && e.message === useRunMessage
                        }

                        try {
                            const results1 = params ? stmt.all(...params) : stmt.all()

                            const rows = results1
                                .filter((row: any): row is Row => typeof row === 'object')

                            return Promise.resolve(success({...resultSet, rows}))
                        } catch (e: any) {

                            if (!isRunError(e)) return Promise.resolve(failure(e))
                        }

                        try {
                            const results1 = params ? stmt.run(...params) : stmt.run()
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
