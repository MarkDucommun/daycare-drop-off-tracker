import {databaseFromFileAsync} from "../BetterSQLiteDatabaseAccess";

describe("BetterSQLiteDatabaseAccess", () => {
    test("it can open a database", async () => {
        const db = (await databaseFromFileAsync(":memory:")).forceGet()

        expect(db).toBeDefined()

        db.execSync("CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)")
        db.execSync("INSERT INTO test (name) VALUES ('A')")
        db.execSync("INSERT INTO test (name) VALUES ('B')")
        db.execSync("INSERT INTO test (name) VALUES ('C')")

        const statement = db.prepareSync("SELECT * FROM test").forceGet()

        expect(statement.getFirstSync([]).forceGet()).toEqual(({id: 1, name: "A"}))

        statement.finalizeSync()
    })
})
