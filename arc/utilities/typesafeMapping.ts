import {Result} from "./results/results";
import {failure, success} from "./results/successAndFailure";
import {traverse} from "./results/traverse";

type KeyInfo = {
    type: 'string' | 'number' | 'boolean' | 'object'
    nullable?: boolean
}

export type SimpleTypeDetails<T> = {
    [Property in keyof T]: 'string' | 'number' | 'boolean' | 'object' | KeyInfo
}

export type KeyList<T> = {
    [Property in keyof T]: undefined
}

export const createKeyPresenceValidator = <T>(details: KeyList<T>) => (input: unknown): Result<string, T> => {

    if (typeof input !== 'object' || input === null) return failure("Input is not an object")

    return Object.keys(details).reduce((acc, key) =>
        acc.flatMap(() => input[key as keyof unknown] === undefined ?
            failure(`Value for key ${key} must be present`) :
            acc
        ), success<string, null>(null))
        .map(() => input as T)
}

type SimpleMapper<T> = (input: unknown) => Result<string, T>

export const mapAll = <T>(mapper: SimpleMapper<T>)=> (all: unknown[]): Result<string, T[]> => traverse(all.map(mapper))


export const flatMapAll = <T, U>(transform: (input: T) => Result<string, U>) => (all: T[]): Result<string, U[]> => traverse(all.map(transform))
export const transformAll = <T, U>(transform: (input: T) => U) => (all: T[]): U[] => all.map(transform)

export const createSimpleTypeSafeMapper = <T>(details: SimpleTypeDetails<T>): SimpleMapper<T> => {
    return (input) => {

        if (typeof input !== 'object' || input === null) return failure("Input is not an object")

        return Object.keys(details).reduce((acc, key) =>
            acc.flatMap(() => {
                const keyInfo = details[key as keyof T]
                const value = input[key as keyof unknown]

                if (typeof keyInfo === 'object') {
                    return value === null && keyInfo.nullable === false ? failure(`Value for key ${key} is null`) : success(null)
                } else {
                    return typeof value !== keyInfo ? failure(`Value for key ${key} is not of type ${keyInfo}`) : acc
                }
            }), success<string, null>(null))
            .map(() => input as T)
    }
}
