import {AsyncResult, onSuccessSetState} from "./results";
import {Dispatch, SetStateAction} from "react";

export const setAsyncState = <T extends any>(retrieve: () => AsyncResult<T>, setState: Dispatch<SetStateAction<T>>) => () => {
    return retrieve().then(onSuccessSetState(setState))
}
