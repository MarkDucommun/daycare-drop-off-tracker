import {Result} from "./results/results";
import {failure, success} from "./results/successAndFailure";

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


export const createSimpleTypeSafeMapper = <T>(details: SimpleTypeDetails<T>): (input: unknown) => Result<string, T> => {
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
