export type Result<L, R> = Success<L, R> | Failure<L, R>

interface Success<L, R> extends ResultInterface<L, R> {
    type: "success",
}

interface Failure<L, R> extends ResultInterface<L, R> {
    type: "failure",
}

type ResultInterface<L, R> = {
    getOrElse: (fn: () => R) => R
    getOrNull: () => R | null
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
    type: 'success' | 'failure'
}

export const map = <L, R, NR>(fn: (it: R) => NR): (result: Result<L, R>) => Result<L, NR> => (result) =>
    result.map(fn);

export const mapAsync = <L, R, NR>(fn: (it: R) => Promise<NR>): (result: Result<L, R>) => Promise<Result<L, NR>> => (result) =>
    result.mapAsync(fn);

export const doOnSuccess = <L, R>(fn: (it: R) => void): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.doOnSuccess(fn)

export const flatMap = <L, R, NR>(fn: (it: R) => ResultInterface<L,NR>): (result: Result<L, R>) => Result<L, NR> => (result) =>
    result.flatMap(fn)

export const flatMapAsync = <L, R, NR>(fn: (it: R) => Promise<ResultInterface<L,NR>>): (result: Result<L, R>) => Promise<Result<L, NR>> => (result) =>
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

export const todo = <R>(message: string = "NOT IMPLEMENTED"): Result<string, R> => failure(message);

export const todoFn = <R>(message: string = "NOT IMPLEMENTED") => () => todo<R>(message)

export const successIfDefinedRaw = <L, R>(value: R | null | undefined, ifNotDefined: () => L ): Result<L, NonNullable<R>> =>
    value ? success(value) : failure(ifNotDefined());

export const successIfDefined = <R>(value: R | null | undefined): Result<string, NonNullable<R>> =>
    successIfDefinedRaw(value, () => "Value was not defined");

export const successIfTruthyRaw = <L, R>(value: R | null | undefined | boolean, ifFalsy: () => L): Result<L, true | NonNullable<R>> =>
    value ? success(value) : failure(ifFalsy());

export const successIfTruthy = <R>(value: R | null | undefined | boolean): Result<string, true | NonNullable<R>> =>
    successIfTruthyRaw(value, () => "Value was falsy");

export const successIfFalsyRaw = <L, R>(value: R | null | undefined | boolean, ifTruthy: () => L): Result<L, false> =>
    value ? failure(ifTruthy()) : success(false);

export const successIfFalsy = <R>(value: R | null | undefined | boolean): Result<string, false> =>
    successIfFalsyRaw(value, () => "Value was truthy");

export function success<L, R>(value: R): Result<L, R> {
    return {
        getOrElse: () => value,
        getOrNull: () => value,
        map: (fn) => success(fn(value)),
        mapAsync: async (fn) => fn(value).then(it => success(it)),
        doOnSuccess: (fn) => { fn(value); return success(value) },
        flatMap: (fn) => fn(value),
        flatMapAsync: async (fn)=> fn(value),
        mapError: (_) => success(value),
        doOnError: (_) => success(value),
        flatMapError: (_) => success(value),
        flatMapErrorAsync: async (_) => success(value),
        recoverError: (_) => success(value),
        type: "success"
    }
}

export function failure<L, R>(error: L): Result<L, R> {
    return {
        getOrElse: (fn) => fn(),
        getOrNull: () => null,
        map: (_) => failure(error),
        mapAsync: async (_) => failure(error),
        doOnSuccess: (_) => failure(error),
        flatMap: (_) => failure(error),
        flatMapAsync: async (_) => failure(error),
        mapError: (fn) => failure(fn(error)),
        doOnError: (fn) => {fn(error); return failure(error)},
        flatMapError: (fn) => fn(error),
        flatMapErrorAsync: async (fn) => fn(error),
        recoverError: (fn) => success(fn(error)),
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

export const extractKey = <T extends object, V>(key: keyof T): (t: T) => T[keyof T] => (t: T) => t[key]

export const flatten = <T>(arr: Array<Array<T>>): Array<T> => arr.flatMap(it => it)