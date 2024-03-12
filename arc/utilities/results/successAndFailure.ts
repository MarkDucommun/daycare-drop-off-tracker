import {Result} from "./results";

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
        type: "success",
        value
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
        type: "failure",
        error
    }
}

