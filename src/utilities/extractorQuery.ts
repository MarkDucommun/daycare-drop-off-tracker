import {InTransaction} from "./databaseAccess";
import {ColumnData, extractRowsDataForType} from "./rowMapper";
import {Logger} from "./logger";
import {flatMap, successIfDefined} from "./results";

type ExtractorQuery = <T extends object, K extends keyof T & string>(sql: string, args?: (string | number | null)[], ...columns: ColumnData<T, K>[]) => InTransaction<T>
type ExtractorQueryAll = <T extends object, K extends keyof T & string>(sql: string, args?: (string | number | null)[], ...columns: ColumnData<T, K>[]) => InTransaction<T[]>

export const extractorQuery: ExtractorQuery = (sql, args, ...columns) => {
    const extractor = extractRowsDataForType(...columns);

    return (executor, _, logger) => {
        return executor(sql, args).then(flatMap(extractor(logger))).then(flatMap(it => successIfDefined(it[0])));
    }
}

export const extractorQueryAll: ExtractorQueryAll = (sql, args, ...columns) => {
    const extractor = extractRowsDataForType(...columns);

    return (executor, _, logger) => {
        return executor(sql, args).then(flatMap(extractor(logger)));
    }
}

export type Extractable<T extends object> = {
    object: T,
    columns: ColumnData<T, keyof T & string>[]
}
