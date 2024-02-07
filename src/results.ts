export type Result<L, R> = Success<L, R> | Failure<L, R>

interface Success<L, R> extends ResultInterface<L, R> {
    type: "success",
}

interface Failure<L, R> extends ResultInterface<L, R> {
    type: "failure",
}

type ResultInterface<L, R> = {
    map: <NR> (fn: (it: R) => NR) => ResultInterface<L, NR>
    flatMap: <NR> (fn: (it: R) => ResultInterface<L, NR>) => ResultInterface<L, NR>
    flatMapAsync: <NR> (fn: (it: R) => Promise<ResultInterface<L, NR>>) => Promise<ResultInterface<L, NR>>
    mapError: <NL> (fn: (it: L) => NL) => ResultInterface<NL, R>,
    type: 'success' | 'failure'
}

export function todo<R>(message: String = "NOT IMPLEMENTED"): Result<String, R> {
    return failure(message)
}

export function success<L, R>(value: R): Result<L, R> {
    return {
        map: <NR extends any>(fn: (it: R) => NR): Result<L, NR> => success(fn(value)),
        flatMap: <NR extends any>(fn: (it: R) => Result<L, NR>): Result<L, NR> => fn(value),
        flatMapAsync: async <NR extends any>(fn: (it: R) => Promise<Result<L, NR>>): Promise<Result<L, NR>> => await fn(value),
        mapError: <NL extends any>(_: (it: L) => NL): Result<NL, R> => success(value),
        type: "success"
    }
}

export function failure<L, R>(error: L): Result<L, R> {
    return {
        map: <NR extends any>(_: (it: R) => NR): Result<L, NR> => failure(error),
        flatMap: <NR extends any>(_: (it: R) => Result<L, NR>): Result<L, NR> => failure(error),
        flatMapAsync: async <NR extends any>(fn: (it: R) => Promise<Result<L, NR>>): Promise<Result<L, NR>> => failure(error),
        mapError: <NL extends any>(fn: (it: L) => NL): Result<NL, R> => failure(fn(error)),
        type: "failure"
    }
}

export function traverse<L, R>(results: Array<Result<L, R>>): Result<L, Array<R>> {
    return results
        .map(result => result.map(inner => [inner]))
        .reduce((previousValue, currentValue) => {
            return previousValue.flatMap(prev => currentValue.map(curr => [...prev, ...curr]))
        })
}
