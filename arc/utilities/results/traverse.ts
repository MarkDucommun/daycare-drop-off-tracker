import {Result} from "./results";
import {success} from "./successAndFailure";

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
