import Database from "better-sqlite3";
import {createTransactionCreator} from "../databaseAccessMock";
import {forceGet, success} from "../results";

describe("Mock Database Usage", () => {
    test("Can I use this database?", async () => {
        const testDatabase = Database(":memory:")

        testDatabase.transaction(() => {
            const first = testDatabase.exec("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
            const statement = testDatabase.prepare("INSERT INTO test (name) VALUES ('test')");
            let insertResult
            try {
                insertResult = statement.all()
            } catch (e) {
                insertResult = statement.run()
            }

            const insertResult2 = testDatabase.prepare("INSERT INTO test (name) VALUES ('test')").run()
            const result = testDatabase.prepare("SELECT * FROM test").all()

            const updateResult = testDatabase.prepare("UPDATE test SET name = 'test2'").run()

        })()
        console.log()
    })

    test("can I adapt this to my databaseAccess abstraction?", async () => {
        const testDatabase = Database(":memory:")

        const transactionCreator = createTransactionCreator(testDatabase)

        const transactionResult = await transactionCreator<string>(async (executor, pushOnRollback, logger) => {

            const createTableResult = forceGet(await executor("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)"))

            const insertTableResult = forceGet(await executor("INSERT INTO test (name) VALUES ('test')"))

            const selectResult = forceGet(await executor("SELECT * FROM test"))

            return success("HELLO WORLD!")
        })

        console.log(forceGet(transactionResult))

        transactionResult.mapError((e) => { throw Error("Test should have succeeded") })
    })
})
