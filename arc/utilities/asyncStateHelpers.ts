import {Dispatch, SetStateAction} from "react";
import {AsyncResult} from "./results/results";
import {onSuccessSetState} from "./results/resultCurriers";

export const setAsyncState = <T extends any>(retrieve: () => AsyncResult<T>, setState: Dispatch<SetStateAction<T>>) => () => {
    retrieve().then(onSuccessSetState(setState))
}
