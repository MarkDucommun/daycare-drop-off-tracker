import {AsyncResult} from "../utilities/results/results";
import {NavigationStateRepository} from "./NavigationStateRepositoryType";
import {
    failureIfTruthy,
    flatMap,
    flatMapAsync,
    flatMapErrorAsync,
    map,
    recover
} from "../utilities/results/resultCurriers";
import {DatabaseAccess} from "../utilities/database/DatabaseTypes";
import {toNull} from "../utilities/results/otherTransforms";
import {InitialState} from "@react-navigation/native";
import {createKeyPresenceValidator, createSimpleTypeSafeMapper} from "../utilities/typesafeMapping";

export const buildDatabaseNavigationStateRepository = async (database: DatabaseAccess): AsyncResult<NavigationStateRepository> =>
    migrate(database).then(map(constructRepository(database)))

function migrate(database: DatabaseAccess): AsyncResult<null> {
    return database
        .execAsync(`CREATE TABLE IF NOT EXISTS navigation_state
                    (
                        id    INTEGER PRIMARY KEY,
                        state TEXT
                    )`
        )
        .then(flatMapAsync(() => database.prepareAsync('SELECT count(*) as count FROM navigation_state')))
        .then(flatMapAsync((statement) => statement.getFirstAsync([]).finally(statement.finalizeAsync)))
        .then(flatMap(createSimpleTypeSafeMapper<HasCount>({count: 'number'})))
        .then(failureIfTruthy(({count}) => count < 1))
        .then(map(toNull))
        .then(flatMapErrorAsync(() => database.execAsync('INSERT INTO navigation_state DEFAULT VALUES')))
        .then(map(toNull))
}

function constructRepository(database: DatabaseAccess): () => NavigationStateRepository {

    return () => ({
        save: save(database),
        retrieve: retrieve(database)
    })
}

function save(database: DatabaseAccess): NavigationStateRepository['save'] {

    return (state) =>
        database.runAsync('UPDATE navigation_state SET state = ?', [JSON.stringify(state)])
            .then(map(toNull))
}

type HasState = { state: string }
type HasCount = { count: number }

function retrieve(database: DatabaseAccess): NavigationStateRepository['retrieve'] {
    const hasStateMapper = createSimpleTypeSafeMapper<HasState>({state: 'string'})
    const initialStateKeyValidator = createKeyPresenceValidator<InitialState>({
        key: undefined,
        index: undefined,
        routeNames: undefined,
        routes: undefined,
        type: undefined
    })

    return () =>

        database.prepareAsync('SELECT state FROM navigation_state')

            .then(flatMapAsync((statement) => statement.getFirstAsync([]).finally(statement.finalizeAsync)))

            .then(flatMap(hasStateMapper))

            .then(map(({state}) => JSON.parse(state)))

            .then(flatMap(initialStateKeyValidator))

            .then(map(it => it as InitialState | undefined))

            .then(recover(undefined as InitialState | undefined))
}

