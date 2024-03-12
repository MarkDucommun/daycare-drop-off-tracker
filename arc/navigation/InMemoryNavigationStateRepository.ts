import {NavigationStateRepository} from "./NavigationStateRepositoryType";
import {InitialState, NavigationState} from "@react-navigation/native";
import {AsyncResult} from "../utilities/results/results";
import {success} from "../utilities/results/successAndFailure";

type InMemoryNavigationStateRepositoryController = {
    overrideSaveResponse: (response: AsyncResult<null>) => void
    overrideRetrieveResponse: (response: AsyncResult<InitialState | undefined> | null) => void
    getRepository: () => NavigationStateRepository
}

export const buildInMemoryNavigationStateRepository = (): InMemoryNavigationStateRepositoryController => {

        let internalState: NavigationState | undefined = undefined
        let saveResponse: AsyncResult<null> = Promise.resolve(success(null))
        let retrieveResponse: AsyncResult<InitialState | undefined> | null = null

        return {
            overrideSaveResponse: (response) => saveResponse = response,
            overrideRetrieveResponse: (response) => retrieveResponse = response,
            getRepository: () => {
                const retrieve: () => AsyncResult<InitialState | undefined> = () => retrieveResponse ? retrieveResponse : Promise.resolve(success(internalState as InitialState | undefined))

                return {
                    save: async (state) => {
                        internalState = state
                        return saveResponse
                    },
                    retrieve
                }
            }
        }
}
