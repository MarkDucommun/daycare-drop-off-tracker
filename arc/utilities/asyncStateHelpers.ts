import {Dispatch, SetStateAction} from "react";
import {AsyncResult} from "./results/results";
import {onSuccessSetState, onSuccessSetStateUninitializedState} from "./results/resultCurriers";

export const setAsyncState = <T extends any>(retrieve: () => AsyncResult<T>, setState: Dispatch<SetStateAction<T>>) => () => {
    retrieve().then(onSuccessSetState(setState))
}
export const setAsyncUninitializedState = <T extends any>(retrieve: () => AsyncResult<T>, setState: Dispatch<SetStateAction<T | undefined>>) => () => {
    retrieve().then(onSuccessSetStateUninitializedState(setState))
}
