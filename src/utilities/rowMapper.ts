import {ResultSet} from "expo-sqlite";
import {failure, Result, success, successIfDefined, successIfTruthy, traverse} from "./results";
import {Row} from "./databaseAccess";
import {createLogger, Logger} from "./logger";

export const extractInsertId = ({insertId}: ResultSet) => successIfDefined(insertId)

export type ColumnData<T extends object, K extends keyof T & string> = {
    key: K
    type: string
    nullable: boolean
}

type ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[], logger: Logger) => (row: Row) => Result<string, T>

const validateColumnValueTypeAndAdd = <T extends object, K extends keyof T & string>(name: K, type: string, nullable: boolean, obj: object) => (columnValue: any): Result<string, object> =>
    typeof columnValue == type || (nullable && columnValue == null) ?
        success({...obj, [name]: columnValue}) :
        failure(`Value of column '${String(name)}' (${columnValue}) has incorrect type, expected type '${type}'`)

const extractColumnValueAndAdd = <T extends object, K extends keyof T & string>(row: Row, key: K, type: string, nullable: boolean, logger: Logger) => (obj: object): Result<string, object> =>
    successIfDefined(row[key])
        .doOnSuccess(value => logger.trace(`Value of column '${key}' is ${value}`))
        .flatMapError(_ => {
            logger.trace("Couldn't find required column in row")
            logger.trace("Is nullable: ", nullable)
            return nullable ? success(null) : failure(`Couldn't find required column '${key}' in row`);
        })
        .flatMap(validateColumnValueTypeAndAdd<T, K>(key, type, nullable, obj))
        .doOnError(e => logger.error(e))

export const extractRowsDataForType = <T extends object, K extends keyof T & string>(...columns: ColumnData<T, K>[]) => (parentLogger?: Logger) => {
    const logger = parentLogger?.createChild("rowMapper") ?? createLogger("rowMapper")
    const rowExtractor = extractRowDataForType<T, K>(columns, logger)
    return ({rows}: ResultSet): Result<string, T[]> => traverse(rows.flatMap(rowExtractor));
}

type ExtractCount = (resultSet: ResultSet) => Result<string, number>

type HasCount = {
    count: number
}

const countExtractor = extractRowsDataForType<HasCount, 'count'>({key: 'count', type: 'number', nullable: false});
export const extractCount: ExtractCount = (resultSet: ResultSet) =>
    countExtractor()(resultSet).flatMap((rows) => successIfTruthy(rows.length == 1).map(_ => rows[0].count))

const reduceRowToObject = <T extends object, K extends keyof T & string>(row: Row, logger: Logger) => (previousValue: Result<string, object>, {key, type, nullable}: ColumnData<T, K>): Result<string, object> =>
    previousValue.flatMap(extractColumnValueAndAdd<T, K>(row, key, type, nullable, logger))

const extractRowDataForType: ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[], logger: Logger) => {

    return (row) =>
        columns.reduce(reduceRowToObject<T, K>(row, logger), success<string, object>({}))
            .map(obj => obj as T);
}
