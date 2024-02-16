import {ResultSet} from "expo-sqlite";
import {failure, Result, success, successIfDefined, traverse} from "../results";
import {Row} from "../databaseAccess";

export const extractInsertId = ({insertId}: ResultSet) => successIfDefined(insertId)

export type ColumnData<T extends object, K extends keyof T & string> = {
    key: K,
    type: string
}

type ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[]) => (row: Row) => Result<string, T>

const validateColumnValueTypeAndAdd = <T extends object, K extends keyof T & string>(name: K, type: string, obj: object) => (columnValue: any): Result<string, object> =>
    typeof columnValue == type ?
        success({...obj, [name]: columnValue}) :
        failure(`Value of column '${String(name)}' (${columnValue}) has incorrect type, expected type '${type}'`)

const extractColumnValueAndAdd = <T extends object, K extends keyof T & string>(row: Row, key: K, type: string) => (obj: object): Result<string, object> =>
    successIfDefined(row[key])
        .mapError(_ => `Couldn't find column '${key}' in row`)
        .flatMap(validateColumnValueTypeAndAdd<T, K>(key, type, obj))

export const extractRowsDataForType = <T extends object, K extends keyof T & string>(...columns: ColumnData<T, K>[]) => {
    const rowExtractor = extractRowDataForType<T, K>(columns)
    return ({rows}: ResultSet): Result<string, T[]> => traverse(rows.flatMap(rowExtractor));
}
const reduceRowToObject = <T extends object, K extends keyof T & string>(row: Row) => (previousValue: Result<string, object>, {key, type}: ColumnData<T, K>): Result<string, object> =>
    previousValue.flatMap(extractColumnValueAndAdd<T, K>(row, key, type))

const extractRowDataForType: ExtractColumnDataForType = <T extends object, K extends keyof T & string>(columns: ColumnData<T, K>[]) => (row) =>
    columns.reduce(reduceRowToObject<T, K>(row), success<string, object>({}))
        .map(obj => obj as T)