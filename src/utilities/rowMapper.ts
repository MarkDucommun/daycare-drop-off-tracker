import {ResultSet} from "expo-sqlite";
import {failure, Result, success, successIfDefined, successIfTruthy, todo, traverse} from "./results";
import {Row} from "./databaseAccess";
import {createLogger, Logger} from "./logger";

export const extractInsertId = ({insertId}: ResultSet) => successIfDefined(insertId)

export type ColumnData<T extends object, K extends keyof T & string> = {
    key: K
    type: string
    nullable: boolean
}
export type ColumnDataToo<T extends object> = {
    key: keyof T,
    type: string
    nullable: boolean
}

type ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[], logger: Logger) => (row: Row) => Result<string, T>

type ExtractColumnDataForTypeToo = <T extends object>(columns: ColumnDataToo<T>[], logger: Logger) => (row: Row) => Result<string, T>

const validateColumnValueTypeAndAdd = <T extends object, K extends keyof T & string>(name: K, type: string, nullable: boolean, obj: object) => (columnValue: any): Result<string, object> =>
    typeof columnValue == type || (nullable && columnValue == null) ?
        success({...obj, [name]: columnValue}) :
        failure(`Value of column '${String(name)}' (${columnValue}) has incorrect type, expected type '${type}'`)
const validateColumnValueTypeAndAddToo = <T extends object>(name: keyof T, type: string, nullable: boolean, obj: object) => (columnValue: any): Result<string, object> =>
    typeof columnValue == type || (nullable && columnValue == null) ?
        success({...obj, [name]: columnValue}) :
        failure(`Value of column '${String(name)}' (${columnValue}) has incorrect type, expected type '${type}'`)

const extractColumnValueAndAdd = <T extends object, K extends keyof T & string>(row: Row, key: K, type: string, nullable: boolean, logger: Logger) => (obj: object): Result<string, object> => {
    logger.trace(`Extracting column '${key}' from:`)
    logger.trace(row)
    const rowElement = row[key];
    logger.trace(rowElement)
    return successIfDefined(rowElement)
        .doOnSuccess(value => logger.trace(`Value of column '${key}' is ${value}`))
        .flatMapError(_ => {
            logger.trace("Couldn't find required column in row")
            logger.trace("Is nullable: ", nullable)
            return nullable ? success(null) : failure(`Couldn't find required column '${key}' in row`);
        })
        .flatMap(validateColumnValueTypeAndAdd<T, K>(key, type, nullable, obj))
        .doOnError(e => logger.error(e));
}
const extractColumnValueAndAddToo = <T extends object>(row: Row, key: keyof T, type: string, nullable: boolean, logger: Logger) => (obj: object): Result<string, object> => {
    const stringKey = String(key)
    logger.trace(`Extracting column '${stringKey}' from:`)
    logger.trace(row)
    const rowElement = row[stringKey];
    logger.trace(rowElement)
    return successIfDefined(rowElement)
        .doOnSuccess(value => logger.trace(`Value of column '${stringKey}' is ${value}`))
        .flatMapError(_ => {
            logger.trace("Couldn't find required column in row")
            logger.trace("Is nullable: ", nullable)
            return nullable ? success(null) : failure(`Couldn't find required column '${stringKey}' in row`);
        })
        .flatMap(validateColumnValueTypeAndAddToo<T>(key, type, nullable, obj))
        .doOnError(e => logger.error(e));
}

export const extractRowsDataForType = <T extends object, K extends keyof T & string>(...columns: ColumnData<T, K>[]) => (parentLogger?: Logger) => {
    const logger = parentLogger?.createChild("rowMapper") ?? createLogger("rowMapper")
    const rowExtractor = extractRowDataForType<T, K>(columns, logger)
    return ({rows}: ResultSet): Result<string, T[]> => {
        logger.trace(`Extracting rows - ${rows.length} rows`)
        return traverse(rows.map(row => rowExtractor(row)));
    };
}
export const extractRowsDataForTypeToo = <T extends object>(...columns: ColumnDataToo<T>[]) => (parentLogger?: Logger) => {
    const logger = parentLogger?.createChild("rowMapper") ?? createLogger("rowMapper")
    const rowExtractor = extractRowDataForTypeToo<T>(columns, logger)
    return ({rows}: ResultSet): Result<string, T[]> => {
        logger.trace(`Extracting rows - ${rows.length} rows`)
        return traverse(rows.map(row => rowExtractor(row)));
    };
}

type ExtractCount = (resultSet: ResultSet) => Result<string, number>

type HasCount = {
    count: number
}

type ExtractColumns = <T extends string | number | boolean>(column: string, type: string, logger?: Logger) => (resultSet: ResultSet) => Result<string, Array<T>>

type ExtractColumn = <T extends string | number | boolean>(column: string, type: string, row: Row, logger?: Logger) => Result<string, T>

type ExtractNumber = (column: string) => (resultSet: ResultSet) => Result<string, Array<number>>

const countExtractor = extractRowsDataForType<HasCount, 'count'>({key: 'count', type: 'number', nullable: false});
export const extractCount = (logger?: Logger): ExtractCount => (resultSet: ResultSet) =>
    countExtractor(logger)(resultSet)
        .doOnError(_ => logger?.error("Error extracting count"))
        .flatMap((rows) => successIfTruthy(rows.length == 1).map(_ => rows[0]["count"]))

const reduceRowToObject = <T extends object, K extends keyof T & string>(row: Row, logger: Logger) => (previousValue: Result<string, object>, {key, type, nullable}: ColumnData<T, K>): Result<string, object> =>
    previousValue.flatMap(extractColumnValueAndAdd<T, K>(row, key, type, nullable, logger))
const reduceRowToObjectToo = <T extends object>(row: Row, logger: Logger) => (previousValue: Result<string, object>, {key, type, nullable}: ColumnDataToo<T>): Result<string, object> =>
    previousValue.flatMap(extractColumnValueAndAddToo<T>(row, key, type, nullable, logger))

const extractRowDataForType: ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[], logger: Logger) => {

    return (row) => {
        logger.trace("Extracting row data")
        logger.trace(Object.keys(row))
        logger.trace(typeof row)
        logger.trace("Row: ", row)
        return columns.reduce(reduceRowToObject<T, K>(row, logger), success<string, object>({}))
            .map(obj => obj as T);
    };
}

const extractRowDataForTypeToo: ExtractColumnDataForTypeToo = <T extends object>(columns: ColumnDataToo<T>[], logger: Logger) => {

    return (row) => {
        logger.trace("Extracting row data")
        logger.trace(Object.keys(row))
        logger.trace(typeof row)
        logger.trace("Row: ", row)
        return columns.reduce(reduceRowToObjectToo<T>(row, logger), success<string, object>({}))
            .map(obj => obj as T);
    };
}
