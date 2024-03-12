import {AsyncResult, Result} from "../results/results";


export type DatabaseAccess = {
    execAsync: (sql: string) => AsyncResult<null>
    execSync: (sql: string) => Result<string, null>

    runAsync: (sql: string, params: BindParams) => AsyncResult<RunResult>
    runSync: (sql: string, params: BindParams) => Result<string, RunResult>

    prepareAsync: (sql: string) => AsyncResult<Statement>
    prepareSync: (sql: string) => Result<string, Statement>
}

export type Statement = {
    // executeAsync: (params: BindParams) => AsyncResult<RunResult>
    // executeSync: (params: BindParams) => Result<string, RunResult>
    getFirstAsync: (params: BindParams) => AsyncResult<unknown>
    getFirstSync: (params: BindParams) => Result<string, unknown>
    // getAllAsync: (params: BindParams) => AsyncResult<unknown[]>
    // getAllSync: (params: BindParams) => Result<string, unknown[]>
    // iterateAsync
    // iterateSync
    finalizeAsync: () => AsyncResult<null>
    finalizeSync: () => Result<string, null>
    // resetAsync: () => AsyncResult<null>
    // resetSync: () => Result<string, null>
}

export type RunResult = {
    lastInsertId: number | bigint,
    changes: number
}

export type CreateDatabaseFromFileAsync = (path: string) => AsyncResult<DatabaseAccess>
export type CreateDatabaseFromFileSync = (path: string) => Result<string, DatabaseAccess>

export type BindValue = string | number | null | boolean | Uint8Array;
export type BindParams = Record<string, BindValue> | BindValue[];
