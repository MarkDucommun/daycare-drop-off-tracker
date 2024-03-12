import {failure, success} from "./successAndFailure";
import {AsyncResult, Result} from "./results";
import {successIfTruthy} from "./resultCurriers";

export const extractKey = <T extends object, V extends keyof T>(key: V): (t: T) => T[V] => (t: T) => t[key]

export const flatten = <T>(arr: Array<Array<T>>): Array<T> => arr.flatMap(it => it)

export const apply = <T>(fn: (it: T) => void): (it: T) => T => (it) => {
    fn(it);
    return it;
}

export const ensureLengthOfOneAndExtract = <T>(array: T[]): Result<string, T> =>
    successIfTruthy(array.length == 1)
        .map(_ => array[0])
        .mapError(_ => `Expected exactly one member in array, got ${array.length} members instead`)

export const TODO = <T>(message: string = "NOT IMPLEMENTED"): T => {
    throw new Error(message)
}

export const convertPromise = <T>(promise: Promise<T>): AsyncResult<T> =>
    promise
        .then(it => success<string, T>(it))
        .catch(e => 'message' in e ? failure<string, T>(e.message) : failure<string, T>("Error executing SQL"))

export const safelyExecute = <T>(fn: () => T): Result<string, T> => {
    try {
        return success(fn())
    } catch (e: any) {
        return convertError(e)
    }
}

export const safelyExecuteAsync = <T>(fn: () => Promise<T>): AsyncResult<T> => {
    try {
        return fn().then((output) => success(output), (e: any) => convertError(e))
    } catch (e: any) {
        return Promise.resolve(convertError(e))
    }
}

const convertError = <T>(e: any): Result<string, T> => {
    if (typeof e === 'string') return failure(e)
    if ('message' in e) return failure(e.message)
    return failure("Threw an unexpected object")
}

export const toNull = () => null
