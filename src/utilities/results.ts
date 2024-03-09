import {Logger} from "./logger";
import React from "react";

export type Result<L, R> = Success<L, R> | Failure<L, R>

interface Success<L, R> extends ResultInterface<L, R> {
    type: "success",
}

interface Failure<L, R> extends ResultInterface<L, R> {
    type: "failure",
}

type ResultInterface<L, R> = {
    isSuccess: () => boolean
    isFailure: () => boolean
    getOrElse: (fn: () => R) => R
    getOrNull: () => R | null
    forceGet: (errorMessage?: string) => R
    map: <NR> (fn: (it: R) => NR) => ResultInterface<L, NR>
    mapAsync: <NR> (fn: (it: R) => Promise<NR>) => Promise<ResultInterface<L, NR>>
    doOnSuccess: (fn: (it: R) => void) => ResultInterface<L, R>
    flatMap: <NR> (fn: (it: R) => ResultInterface<L, NR>) => ResultInterface<L, NR>
    flatMapAsync: <NR> (fn: (it: R) => Promise<ResultInterface<L, NR>>) => Promise<ResultInterface<L, NR>>
    mapError: <NL> (fn: (it: L) => NL) => ResultInterface<NL, R>
    doOnError: (fn: (it: L) => void) => ResultInterface<L, R>
    flatMapError: (fn: (it: L) => ResultInterface<L, R>) => ResultInterface<L, R>
    flatMapErrorAsync: (fn: (it: L) => Promise<ResultInterface<L, R>>) => Promise<ResultInterface<L, R>>
    recoverError: (fn: (it: L) => R) => ResultInterface<L, R>
    recover: (it: R) => ResultInterface<L, R>
    type: 'success' | 'failure'
}

export type AsyncResult<R> = Promise<Result<string, R>>

export const getOrElse = <L, R>(fn: () => R): (result: Result<L, R>) => R => (result) =>
    result.getOrElse(fn);

export const getOrNull = <L, R>(result: Result<L, R>): R | null => result.getOrNull();

export const forceGet = <L, R>(result: Result<L, R>, errorMessage?: string): R => result.forceGet(errorMessage);

export const map = <L, R, NR>(fn: (it: R) => NR): (result: Result<L, R>) => Result<L, NR> => (result) =>
    result.map(fn);

export const mapAsync = <L, R, NR>(fn: (it: R) => Promise<NR>): (result: Result<L, R>) => Promise<Result<L, NR>> => (result) =>
    result.mapAsync(fn);

export const doOnSuccess = <L, R>(fn: (it: R) => void): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.doOnSuccess(fn)

export const onSuccessSetState = <L, R>(setStateDispatch: React.Dispatch<React.SetStateAction<R>>): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.doOnSuccess(setStateDispatch)

export const flatMap = <L, R, NR>(fn: (it: R) => ResultInterface<L, NR>): (result: Result<L, R>) => Result<L, NR> => (result) =>
    result.flatMap(fn)

export const flatMapAsync = <L, R, NR>(fn: (it: R) => Promise<ResultInterface<L, NR>>): (result: Result<L, R>) => Promise<Result<L, NR>> => (result) =>
    result.flatMapAsync(fn)

export const mapError = <L, R, NL>(fn: (it: L) => NL): (result: Result<L, R>) => Result<NL, R> => (result) =>
    result.mapError(fn)

export const doOnError = <L, R>(fn: (it: L) => void): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.doOnError(fn)

export const flatMapError = <L, R>(fn: (it: L) => ResultInterface<L, R>): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.flatMapError(fn)

export const flatMapErrorAsync = <L, R>(fn: (it: L) => Promise<ResultInterface<L, R>>): (result: Result<L, R>) => Promise<Result<L, R>> => (result) =>
    result.flatMapErrorAsync(fn)

export const recoverError = <L, R>(fn: (it: L) => R): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.recoverError(fn)

export const recover = <L, R>(it: R): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.recover(it)

export const todo = <R>(message: string = "NOT IMPLEMENTED"): Result<string, R> => failure(message);

export const todoFn = <R>(message: string = "NOT IMPLEMENTED") => () => todo<R>(message)

export const successIfDefinedRaw = <L, R>(value: R | null | undefined, ifNotDefined: () => L): Result<L, NonNullable<R>> =>
    (value != undefined || value != null) ? success(value) : failure(ifNotDefined());

export const successIfDefined = <R>(value: R | null | undefined): Result<string, NonNullable<R>> =>
    successIfDefinedRaw(value, () => "Value was not defined");

export const successIfTruthyRaw = <L, R>(value: R | null | undefined | boolean, ifFalsy: () => L): Result<L, true | NonNullable<R>> => {
    return value || typeof value == 'number' ? success(value) : failure(ifFalsy());
};

export const successIfTruthy = <R>(value: R | null | undefined | boolean): Result<string, true | NonNullable<R>> =>
    successIfTruthyRaw(value, () => "Value was falsy");

export const failureIfTruthyRaw = <L, R>(value: Result<L, R>, expression: (it: R) => boolean, ifTruthy: () => L): Result<L, R> =>
    value.flatMap(it => expression(it) ? failure(ifTruthy()) : success(it))

export const failureIfTruthy =  <R>(expression: (it: R) => boolean, reason?: string) => (value: Result<string, R>): Result<string, R> =>
    failureIfTruthyRaw(value, expression, () => reason ?? "Value was truthy")

export const successIfFalsyRaw = <L, R>(value: R | null | undefined | boolean, ifTruthy: () => L): Result<L, false> =>
    value ? failure(ifTruthy()) : success(false);

export const successIfFalsy = <R>(value: R | null | undefined | boolean): Result<string, false> =>
    successIfFalsyRaw(value, () => "Value was truthy");

export function success<L, R>(value: R): Result<L, R> {
    return {
        isSuccess: () => true,
        isFailure: () => false,
        getOrElse: () => value,
        getOrNull: () => value,
        forceGet: (_) => value,
        map: (fn) => success(fn(value)),
        mapAsync: async (fn) => fn(value).then(it => success(it)),
        doOnSuccess: (fn) => {
            fn(value);
            return success(value)
        },
        flatMap: (fn) => fn(value),
        flatMapAsync: async (fn) => fn(value),
        mapError: (_) => success(value),
        doOnError: (_) => success(value),
        flatMapError: (_) => success(value),
        flatMapErrorAsync: async (_) => success(value),
        recoverError: (_) => success(value),
        recover: (_) => success(value),
        type: "success"
    }
}

export function failure<L, R>(error: L): Result<L, R> {
    return {
        isSuccess: () => false,
        isFailure: () => true,
        getOrElse: (fn) => fn(),
        getOrNull: () => null,
        forceGet: (errorMessage) => { throw Error(`${errorMessage ?? "You get what you asked for"} - ${error}`) },
        map: (_) => failure(error),
        mapAsync: async (_) => failure(error),
        doOnSuccess: (_) => failure(error),
        flatMap: (_) => failure(error),
        flatMapAsync: async (_) => failure(error),
        mapError: (fn) => failure(fn(error)),
        doOnError: (fn) => {
            fn(error);
            return failure(error)
        },
        flatMapError: (fn) => fn(error),
        flatMapErrorAsync: async (fn) => fn(error),
        recoverError: (fn) => success(fn(error)),
        recover: (it) => success(it),
        type: "failure"
    }
}

export const traverse = <L, R>(results: Array<Result<L, R>>): Result<L, Array<R>> => {
    const resultMap = results
        .map(result => result.map(inner => [inner]));

    if (resultMap.length == 0) return success<L, Array<R>>([])

    return resultMap
        .reduce((previousValue, currentValue) =>
            previousValue.flatMap(prev => currentValue.map(curr => [...prev, ...curr])));
};

export const traverse2 = <L, R1, R2>(pair: [Result<L, R1>, Result<L, R2>]): Result<L, [R1, R2]> =>
    pair[0].flatMap(it1 => pair[1].map(it2 => [it1, it2] as [R1, R2]))
export const traverse3 = <L, T1, T2, T3>(tuple: [Result<L, T1>, Result<L, T2>, Result<L, T3>]): Result<L, [T1, T2, T3]> =>
    tuple[0].flatMap(it1 => traverse2([tuple[1], tuple[2]]).map(it => [it1, ...it] as [T1, T2, T3]))

export const traverse4 = <L, T1, T2, T3, T4>(tuple: [Result<L, T1>, Result<L, T2>, Result<L, T3>, Result<L, T4>]): Result<L, [T1, T2, T3, T4]> =>
    tuple[0].flatMap(it1 => traverse3([tuple[1], tuple[2], tuple[3]]).map(it => [it1, ...it] as [T1, T2, T3, T4]))

export const traverse5 = <L, T1, T2, T3, T4, T5>(tuple: [Result<L, T1>, Result<L, T2>, Result<L, T3>, Result<L, T4>, Result<L, T5>]): Result<L, [T1, T2, T3, T4, T5]> =>
    tuple[0].flatMap(it1 => traverse4([tuple[1], tuple[2], tuple[3], tuple[4]]).map(it => [it1, ...it] as [T1, T2, T3, T4, T5]))

export const traverseOr = <L, R>(results: Array<Result<L, R>>): Result<L, Array<R>> => {
    const resultMap = results
        .map(result => result.map(inner => [inner]));

    if (resultMap.length == 0) return success<L, Array<R>>([])

    return resultMap
        .reduce((previousValue, currentValue) =>
            previousValue.flatMap(prev => currentValue
                .map(curr => [...prev, ...curr])
                .recoverError(() => prev)), success<L, R[]>([]));
}

export const extractKey = <T extends object, V>(key: keyof T): (t: T) => T[keyof T] => (t: T) => t[key]

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
        if (typeof e === 'string') return failure(e)
        if ('message' in e) return failure(e.message)
        return failure("??")
    }
}

export const loggerCurry = <T, U>(fn: (t: T, logger?: Logger) => U) => (logger: Logger) => (t: T) => fn(t, logger)

export const toNull = () => null
