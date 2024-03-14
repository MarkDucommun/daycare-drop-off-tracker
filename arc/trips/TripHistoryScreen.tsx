import React, {useContext, useEffect, useState} from "react";
import {BaseView} from "../styles/baseView";
import {Table} from "../components/table/Table";
import {DataRow, HeaderColumn} from "../../src/shared-components/TableTypes";
import {TripStateRepositoryContext} from "./TripStateRepositoryContext";
import {TripStateSummary} from "./TripStateRepositoryType";
import {setAsyncState} from "../utilities/asyncStateHelpers";
import {format, formatDurationShort} from "../utilities/time/formatting";
import {TimeProviderContext} from "../utilities/time/TimeProviderContext";

export const TripHistoryScreen: React.FC = () => {
    const tripStateRepository = useContext(TripStateRepositoryContext)
    const {currentTime, runOnInterval} = useContext(TimeProviderContext)
    const [allTrips, setAllTrips] = useState<TripStateSummary[]>([])
    const [now, setNow] = useState(currentTime)

    useEffect(setAsyncState(tripStateRepository.allTrips, setAllTrips), [])
    useEffect(() => runOnInterval(() => setNow(currentTime()), 1000), []);

    return (<BaseView>
        <Table header={headerColumns} data={allTrips.map(tripStateSummaryToRow(currentTime()))}/>
    </BaseView>)
}

const tripStateSummaryToRow = (now: number) => (trip: TripStateSummary): DataRow => {
    const duration = trip.endTime ?
        trip.endTime - trip.startTime :
        now - trip.startTime

    return [
        format(trip.startTime),
        trip.origin,
        formatDurationShort(duration)
    ]
}

const headerColumns: HeaderColumn[] = [
    {caption: 'Start', index: 0, width: '40%'},
    {caption: 'Origin', index: 1, width: '30%'},
    {caption: 'Duration', index: 2, width: '30%'},
]
