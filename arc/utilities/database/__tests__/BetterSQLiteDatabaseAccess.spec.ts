import {databaseFromFileAsync} from "../BetterSQLiteDatabaseAccess";

describe("BetterSQLiteDatabaseAccess", () => {
    test("it can open a database", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()

        expect(db).toBeDefined()

        await db.execAsync("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
        await db.execAsync("INSERT INTO test (name) VALUES ('A')")
        await db.execAsync("INSERT INTO test (name) VALUES ('B')")
        await db.execAsync("INSERT INTO test (name) VALUES ('C')")

        const statement = db.prepareSync("SELECT * FROM test").forceGet()

        const all = (await statement.getAllAsync([])).forceGet()

        expect(all).toEqual([
            {id: 1, name: "A"},
            {id: 2, name: "B"},
            {id: 3, name: "C"}
        ])

        statement.finalizeSync()
    })
})
