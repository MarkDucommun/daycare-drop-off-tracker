export type Result<L, R> = Success<L, R> | Failure<L, R>

interface Success<L, R> extends ResultInterface<L, R> {
    type: "success",
    value: R
}

interface Failure<L, R> extends ResultInterface<L, R> {
    type: "failure",
    error: L
}

export type ResultInterface<L, R> = {
    isSuccess: () => boolean
    isFailure: () => boolean
    getOrElse: (fn: () => R) => R
    getOrNull: () => R | null
    forceGet: (errorMessage?: string) => R
    map: <NR> (fn: (it: R) => NR) => Result<L, NR>
    mapAsync: <NR> (fn: (it: R) => Promise<NR>) => Promise<Result<L, NR>>
    doOnSuccess: (fn: (it: R) => void) => Result<L, R>
    flatMap: <NR> (fn: (it: R) => Result<L, NR>) => Result<L, NR>
    flatMapAsync: <NR> (fn: (it: R) => Promise<Result<L, NR>>) => Promise<Result<L, NR>>
    mapError: <NL> (fn: (it: L) => NL) => Result<NL, R>
    doOnError: (fn: (it: L) => void) => Result<L, R>
    flatMapError: (fn: (it: L) => Result<L, R>) => Result<L, R>
    flatMapErrorAsync: (fn: (it: L) => Promise<Result<L, R>>) => Promise<Result<L, R>>
    recoverError: (fn: (it: L) => R) => Result<L, R>
    recover: (it: R) => Result<L, R>
    type: 'success' | 'failure'
}

export type AsyncResult<R> = Promise<Result<string, R>>
