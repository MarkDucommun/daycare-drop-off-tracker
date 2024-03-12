import AsyncStorage from "@react-native-async-storage/async-storage/lib/typescript/AsyncStorage.native";
import {NavigationStateRepository} from "./NavigationStateRepositoryType";
import {InitialState} from "@react-navigation/native";
import {failure, success} from "../utilities/results/successAndFailure";
import {AsyncResult} from "../utilities/results/results";

export const buildAsyncStorageNavigationStateRepository = (): NavigationStateRepository => {
    const STATE_KEY = "NAVIGATION_STATE_V1"

    const retrieve = async (): AsyncResult<InitialState | undefined> => {
        try {
            const state = await AsyncStorage.getItem(STATE_KEY)
            if (state) {
                return success<string, InitialState | undefined>(JSON.parse(state) as InitialState)
            } else {
                return success<string, InitialState | undefined>(undefined)
            }
        } catch (e) {
            return success<string, InitialState | undefined>(undefined)
        }
    }

    return {
        retrieve,
        save: async (state) => {
            try {
                await AsyncStorage.setItem(STATE_KEY, JSON.stringify(state))
                return success(null)
            } catch (e) {
                const error: string = typeof e === "string" ?
                    e :
                    e && typeof e === "object" && 'message' in e ?
                        typeof e.message === "string" ? e.message : "Unknown error occurred while saving navigation state" : "Unknown error occurred while saving navigation state"
                return failure<string, null>(error)
            }
        }
    }
}
