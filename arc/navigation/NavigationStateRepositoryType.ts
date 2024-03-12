import {InitialState, NavigationState} from "@react-navigation/native";
import {AsyncResult} from "../utilities/results/results";
import {AppStackParams} from "./AppStackParams";

export type NavigationStateRepository = {
    save: (state: NavigationState | undefined) => AsyncResult<null>
    retrieve: () => AsyncResult<InitialState | undefined>
}
