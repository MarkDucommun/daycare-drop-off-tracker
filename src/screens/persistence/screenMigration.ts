import {Logger} from "../../utilities/logger";
import {ExecuteSQL, InTransaction} from "../../utilities/databaseAccess";
import {
    doOnSuccess,
    flatMap,
    flatMapAsync,
    flatMapError,
    map,
    successIfTruthy,
    successIfTruthyRaw
} from "../../utilities/results";
import {extractCount} from "../../utilities/rowMapper";

export const ensureScreenTableExists: InTransaction<null> = (executor, _, logger) => {
    logger.debug("Ensuring screen table exists")
    return executor("create table if not exists screen (id INTEGER PRIMARY KEY NOT NULL, name TEXT NOT NULL, version INTEGER NOT NULL);")
        .then(doOnSuccess(_ => logger.debug("Ensuring single row in screen table")))
        .then(flatMapAsync(_ => executor("SELECT count(*) as count FROM screen;")))
        .then(flatMap(extractCount(logger)))
        .then(doOnSuccess(count => logger.debug("Got screen table row count: " + count)))
        .then(flatMapAsync(insertDefaultRow(executor, logger)))
        .then(map(_ => null))
}

const insertDefaultRow = (executor: ExecuteSQL, logger: Logger) => (rowCount: number) =>
    successIfTruthyRaw(rowCount == 0, () => 'row count was not 0')
        .doOnSuccess(_ => logger.debug("Inserting initial screen"))
        .flatMapAsync(_ => executor("INSERT INTO screen (name, version) VALUES ('menu', 0)"))
        .then(map(_ => true))
        .then(flatMapError(error => successIfTruthy(error == 'row count was not 0')))

