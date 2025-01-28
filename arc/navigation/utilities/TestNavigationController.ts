import {AsyncResult} from "../../utilities/results/results";
import {InitialState} from "@react-navigation/native";
import {NavigationStateRepository} from "../NavigationStateRepositoryType";

export type NavigationController = {
    overrideSaveResponse: (response: AsyncResult<null>) => void
    overrideRetrieveResponse: (response: AsyncResult<InitialState | undefined>) => void
    resetRetrieveResponse: () => void
}

type ConstructNavigation = () => { repository: NavigationStateRepository, navigationController: NavigationController }
