import {AsyncResult} from "../utilities/results/results";
import {NavigationStateRepository} from "./NavigationStateRepositoryType";
import {flatMapAsync, map, todo} from "../utilities/results/resultCurriers";
import {DatabaseAccess} from "../utilities/database/DatabaseTypes";
import {toNull} from "../utilities/results/otherTransforms";
import {failure, success} from "../utilities/results/successAndFailure";
import {InitialState} from "@react-navigation/native";

export const buildDatabaseNavigationStateRepository = async (database: DatabaseAccess): AsyncResult<NavigationStateRepository> => {

    return migrate(database)
        .then(map(constructRepository(database)))
}

function migrate(database: DatabaseAccess): AsyncResult<null> {
    return database
        .execAsync(`CREATE TABLE IF NOT EXISTS navigation_state
                    (
                        id    INTEGER PRIMARY KEY,
                        state TEXT
                    )`
        )
        .then(flatMapAsync(() => database.execAsync('INSERT INTO navigation_state DEFAULT VALUES')))
        .then(map(toNull))
}

function constructRepository(database: DatabaseAccess): () => NavigationStateRepository {

    return () => ({
        save: save(database),
        retrieve: retrieve(database)
    })
}

function save(database: DatabaseAccess): NavigationStateRepository['save'] {
    return (state) => {
        const stateString = JSON.stringify(state);
        console.log(stateString);
        return database.runAsync('UPDATE navigation_state SET state = ?', [stateString])
            .then(map(toNull));
    }
}

function retrieve(database: DatabaseAccess): NavigationStateRepository['retrieve'] {
    return async () => {
        const result = await database.prepareAsync('SELECT state FROM navigation_state')
            .then(flatMapAsync((statement) => statement.getFirstAsync([])))

        if (result.type === 'success' && result.value && typeof result.value === "object" && 'state' in result.value && typeof result.value.state === "string") {
            const value = JSON.parse(result.value.state);

            if (value && typeof value === "object" && 'key' in value && 'index' in value && 'routeNames' in value && 'routes' in value && 'type' in value) {
                return success(value)
            }
        }

        return success<string, InitialState | undefined>(undefined)
    }
}
