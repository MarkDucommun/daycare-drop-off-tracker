import {AppEntry} from "./AppEntry";
import React, {useEffect, useState} from "react";
import {buildDatabaseNavigationStateRepository} from "./navigation/SQLiteNavigationStateRepository";
import {NavigationStateRepository} from "./navigation/NavigationStateRepositoryType";
import {BaseView} from "./styles/baseView";
import {Text} from "react-native";
import {databaseFromFileAsync} from "./utilities/database/ExpoSQLiteNextDatabaseAccess";
import {flatMapAsync, onSuccessSetStateUninitializedState} from "./utilities/results/resultCurriers";
import {TripStateRepository} from "./trips/TripStateRepositoryType";
import {buildDatabaseTripStateRepository} from "./trips/TripStateRepository";

export const DeviceAppEntry: React.FC = () => {

    const [
        navigationStateRepository,
        setNavigationStateRepository
    ] = useState<NavigationStateRepository>()

    const [tripStateRepository, setTripStateRepository] = useState<TripStateRepository>()

    useEffect(() => {
        if (!navigationStateRepository)
            retrieveNavigationStateRepository("navigation-state-v7.db")
                .then(onSuccessSetStateUninitializedState(setNavigationStateRepository))
        if (!tripStateRepository)
            retrieveTripStateRepository("trip-state-v3.db")
                .then(onSuccessSetStateUninitializedState(setTripStateRepository))
    }, []);

    if (!navigationStateRepository || !tripStateRepository) return <BaseView><Text>Loading</Text></BaseView>

    return <AppEntry
        navigationStateRepository={navigationStateRepository}
        tripStateRepository={tripStateRepository}
    />
}

const retrieveNavigationStateRepository = (database: string) =>
    databaseFromFileAsync(database)
        .then(flatMapAsync(buildDatabaseNavigationStateRepository))

const retrieveTripStateRepository = (database: string) =>
    databaseFromFileAsync(database)
        .then(flatMapAsync(buildDatabaseTripStateRepository))
