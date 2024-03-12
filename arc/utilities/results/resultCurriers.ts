import React from "react";
import {failure, success} from "./successAndFailure";
import {Result, ResultInterface} from "./results";

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

export const flatMap = <L, R, NR>(fn: (it: R) => Result<L, NR>): (result: Result<L, R>) => Result<L, NR> => (result) =>
    result.flatMap(fn)

export const flatMapAsync = <L, R, NR>(fn: (it: R) => Promise<Result<L, NR>>): (result: Result<L, R>) => Promise<Result<L, NR>> => (result) =>
    result.flatMapAsync(fn)

export const mapError = <L, R, NL>(fn: (it: L) => NL): (result: Result<L, R>) => Result<NL, R> => (result) =>
    result.mapError(fn)

export const doOnError = <L, R>(fn: (it: L) => void): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.doOnError(fn)

export const flatMapError = <L, R>(fn: (it: L) => Result<L, R>): (result: Result<L, R>) => Result<L, R> => (result) =>
    result.flatMapError(fn)

export const flatMapErrorAsync = <L, R>(fn: (it: L) => Promise<Result<L, R>>): (result: Result<L, R>) => Promise<Result<L, R>> => (result) =>
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
