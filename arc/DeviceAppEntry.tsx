import {AppEntry} from "./AppEntry";
import React, {useEffect, useState} from "react";
import {buildDatabaseNavigationStateRepository} from "./navigation/SQLiteNavigationStateRepository";
import {NavigationStateRepository} from "./navigation/NavigationStateRepositoryType";
import {BaseView} from "./styles/baseView";
import {Text} from "react-native";
import {databaseFromFileAsync} from "./utilities/database/ExpoSQLiteNextDatabaseAccess";
import {flatMapAsync, onSuccessSetStateUninitializedState} from "./utilities/results/resultCurriers";

export const DeviceAppEntry: React.FC = () => {

    const [
        navigationStateRepository,
        setNavigationStateRepository
    ] = useState<NavigationStateRepository>()

    useEffect(() => {
        if (!navigationStateRepository)
            retrieveNavigationStateRepository("navigation-state-v2.db")
                .then(onSuccessSetStateUninitializedState(setNavigationStateRepository))
    }, []);

    if (!navigationStateRepository) return <BaseView><Text>Loading</Text></BaseView>

    return <AppEntry navigationStateRepository={navigationStateRepository}/>
}

const retrieveNavigationStateRepository = (database: string) =>
    databaseFromFileAsync(database)
        .then(flatMapAsync(buildDatabaseNavigationStateRepository))
