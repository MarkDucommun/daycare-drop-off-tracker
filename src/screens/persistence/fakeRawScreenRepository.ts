import {BuildRawScreenRepository} from "./rawScreenRepository";
import {success} from "../../utilities/results";
import {ResultSet} from "expo-sqlite";
import {Row} from "../../utilities/databaseAccess";

export const rawScreenRepository: BuildRawScreenRepository = () => {

    let currentScreen = {name: "1", version: 1}

    return {
        async getCurrentScreen(parentLogger) {
            return success(currentScreen)
        },
        async saveScreenNameTransaction(parentLogger ){
            return success({
                async getScreenNameVersions() {
                    return success(currentScreen);
                },
                async saveScreenName(screen) {
                    const value: ResultSet = {rows: [] as Row[], insertId: 1, rowsAffected: 1};
                    currentScreen = screen
                    return success(value)
                }
            })
        },
        async setup(parentLogger) {
            parentLogger?.debug("Setting up raw screen repository")
            return success(null)
        },
    }
}
