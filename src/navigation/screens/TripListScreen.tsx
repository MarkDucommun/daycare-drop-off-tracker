import React, {ReactNode, useContext, useEffect, useState} from "react";
import {createLoggerFromParent} from "../../utilities/logger";
import {LoggerContext} from "../../LoggerContext";
import {TripRepositoryContext} from "../../trips/persistence/TripRepositoryContext";
import {TripOverview} from "../../tripTypes";
import {StyleSheet, View} from "react-native";
import {Table} from "../../shared-components/Table";
import {HeaderColumn} from "../../shared-components/TableTypes";
import {formatDuration, formatTime} from "../../utilities/time";
import {setAsyncState} from "../../utilities/asyncStateHelpers";


export const TripListScreen: React.FC = () => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("trip-history")

    const repository = useContext(TripRepositoryContext)

    const [
        tripOverviews,
        setTripOverviews
    ] = useState<TripOverview[]>([])

    useEffect(setAsyncState(repository.allTrips, setTripOverviews), []);

    return (
        <View style={{...styles.container}}>
            <Table header={headers} data={tripOverviews.map(formatTripOverview)}/>
        </View>
    );
}

const headers: HeaderColumn[] = [
    {caption: "ID", index: 0, width: '10%'},
    {caption: "Origin", index: 1, width: '20%'},
    {caption: "State", index: 2, width: '20%'},
    {caption: "Start Time", index: 3, width: '25%'},
    {caption: "Duration", index: 4, width: '25%'},
]

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

type FormatTripOverview = (tripOverview: TripOverview) => ReactNode[]

const formatTripOverview: FormatTripOverview = (
    {
        id,
        origin,
        state,
        duration,
        startTime
    }) =>
    [
        id,
        origin,
        state,
        formatTime(startTime),
        formatDuration(duration)
    ]
