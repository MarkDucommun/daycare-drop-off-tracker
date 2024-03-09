import {createTransactionCreatorForFile} from "../../utilities/databaseAccessMock";
import {doOnError, doOnSuccess, failure, flatMapAsync, forceGet, map, success, toNull} from "../../utilities/results";
import {ResultSet} from "expo-sqlite";
import {TransactionCreator} from "../../utilities/databaseAccess";

type ExplodingExecutor = (sql: string, params?: any[]) => Promise<ResultSet>
const testFriendlyTransactionCreator = (transactionCreator: TransactionCreator) => {
    return <T>(f: (executor: ExplodingExecutor) => Promise<T>) => {
        return transactionCreator(async (executor) => {
            return success<string, T>(await f((sql, params) => {
                return executor(sql, params).then(forceGet)
            }));
        })
    }
}

describe("some SQL tests", () => {
    test("interesting SQLite join", async () => {
        // const tc = testFriendlyTransactionCreator(createTransactionCreatorForFile(":memory:").forceGet())
        //
        // await tc(async (executor) => {
        //     await executor(
        //         `CREATE TABLE IF NOT EXISTS parent
        //          (
        //              id   INTEGER PRIMARY KEY NOT NULL,
        //              name TEXT
        //          )`)
        //     await executor(
        //         `CREATE TABLE IF NOT EXISTS child
        //          (
        //              name      TEXT,
        //              timestamp INTEGER,
        //              FOREIGN KEY (parent_id) REFERENCES parent (id)
        //          )`)
        //     const {insertId: p1} = await executor("INSERT INTO parent (name) VALUES ('1')")
        //
        //     return null
        // })

        await createTransactionCreatorForFile(":memory:").forceGet()<null>(async (executor) => {
            return executor("PRAGMA foreign_keys = ON;")
                .then(flatMapAsync(_ => executor(`CREATE TABLE IF NOT EXISTS parent
                 (
                     id   INTEGER PRIMARY KEY NOT NULL,
                     name TEXT
                 )`)))
                .then(flatMapAsync(() => executor(
                    `CREATE TABLE IF NOT EXISTS child
                     (
                         name      TEXT,
                         timestamp INTEGER,
                         parent_id INTEGER
--                          FOREIGN KEY (parent_id) REFERENCES parent (id)
                     )`)))
                .then(doOnSuccess(_ => console.log("I AM A CHOMPION")))
                .then(doOnError(error => console.log(error)))
                .then(flatMapAsync(() => executor("INSERT INTO parent (name) VALUES ('1')")))
                .then(flatMapAsync(async ({insertId}) => {
                    if (insertId === undefined) return failure<string, ResultSet>("insertId is undefined")
                    return executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('A', ?, 0)", [insertId])
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('B', ?, 1)", [insertId])))
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('C', ?, 2)", [insertId])))
                }))
                .then(flatMapAsync(() => executor("INSERT INTO parent (name) VALUES ('2')")))
                .then(flatMapAsync(async ({insertId}) => {
                    if (insertId === undefined) return failure<string, ResultSet>("insertId is undefined")
                    return executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('D', ?, 3)", [insertId])
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('E', ?, 4)", [insertId])))
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('F', ?, 5)", [insertId])))
                }))
                .then(flatMapAsync(() => executor("INSERT INTO parent (name) VALUES ('3')")))
                .then(flatMapAsync(async ({insertId}) => {
                    if (insertId === undefined) return failure<string, ResultSet>("insertId is undefined")
                    return executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('G', ?, 6)", [insertId])
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('H', ?, 7)", [insertId])))
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('I', ?, 8)", [insertId])))
                }))
                .then(flatMapAsync(() => executor("INSERT INTO parent (name) VALUES ('4')")))
                .then(flatMapAsync(async ({insertId}) => {
                    if (insertId === undefined) return failure<string, ResultSet>("insertId is undefined")
                    return executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('J', ?, 9)", [insertId])
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('K', ?, 10)", [insertId])))
                        .then(flatMapAsync(_ => executor("INSERT INTO child (name, parent_id, timestamp) VALUES ('L', ?, 11)", [insertId])))
                }))
                .then(map(toNull))
                .then(flatMapAsync(() => executor(`
                    WITH latest AS (SELECT parent_id, MAX(timestamp) as latest_timestamp, name as latest_name
                                    FROM child
                                    GROUP BY parent_id),
                    earliest AS (SELECT parent_id, MIN(timestamp) as earliest_timestamp, name as earliest_name
                                      FROM child
                                      GROUP BY parent_id)
                    SELECT *
                    FROM latest
                             LEFT JOIN earliest ON latest.parent_id = earliest.parent_id
                            LEFT JOIN parent ON latest.parent_id = parent.id;
                `)))
                .then(doOnSuccess(console.log))
                .then(doOnError(console.log))
        })

    })
})
