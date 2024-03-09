import React, {useEffect, useState} from "react";
import {Loading} from "../../navigation/Loading";
import {createTransactionCreatorForFile, TransactionCreator} from "../../utilities/databaseAccess";
import {
    doOnSuccess,
    failure,
    failureIfTruthy,
    flatMap,
    flatMapAsync,
    map,
    success,
    traverse
} from "../../utilities/results";
import {extractRowsDataForType} from "../../utilities/rowMapper";
import {Button, StyleSheet, View} from "react-native";
import {Event, RawEvent} from "../persistence/AccelerationRepository";
import {createAndShareRecords} from "../AccelerationSharer";
import {formatTimeWithoutDate} from "../../utilities/time";
import {DataRow, HeaderColumn} from "../../shared-components/TableTypes";
import {Table} from "../../shared-components/Table";

export const AccelerationResultsScreen: React.FC = () => {

    const [transactionCreator, setTransactionCreator] = useState<{ a: TransactionCreator }>()
    const [events, setEvents] = useState<Event[]>(new Array(0).fill([0, 0, 0, 0])) // timestamp, x, y, z

    const extractor = extractRowsDataForType<RawEvent, keyof RawEvent>(
        {key: 'timestamp', type: 'number', nullable: false},
        {key: 'data', type: 'string', nullable: false}
    )

    useEffect(() => {
        createTransactionCreatorForFile("acceleration.db")
            .doOnSuccess(tc => setTransactionCreator({a: tc}))
            .doOnSuccess(_ => console.log("DATABASE CREATED"))
            .flatMapAsync(tc => tc((executor) => executor("CREATE TABLE IF NOT EXISTS acceleration (timestamp INTEGER, data TEXT);")).then(map(_ => tc)))
            .then(doOnSuccess(_ => console.log("TABLE CREATED")))
            .then(flatMapAsync(tc => tc((executor) => executor("SELECT * FROM acceleration ORDER BY timestamp LIMIT 500;"))))
            .then(doOnSuccess(({rows}) => console.log("ROWS RETRIEVED " + rows.length)))
            .then(flatMap(extractor()))
            .then(flatMap((rawEvents) => {
                const events = rawEvents.map(rawEvent => {
                    return failureIfTruthy<any[]>(it => it.length !== 3, "Invalid data format")
                    (success(rawEvent.data.split(',')))
                        .flatMap(it => {
                            const x = parseFloat(it[0])
                            const y = parseFloat(it[1])
                            const z = parseFloat(it[2])
                            if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return failure<string, Event>("Couldn't parse data")

                            return success({timestamp: rawEvent.timestamp, x, y, z})
                        })
                })
                return traverse(events)
            }))
            .then(doOnSuccess(events => setEvents(events)))
    }, []);

    if (!events || !transactionCreator) return <Loading/>

    const headerColumns: HeaderColumn[] = [
        {caption: 'Time', index: 0, width: '34%'},
        {caption: 'X', index: 1, width: '22%'},
        {caption: 'Y', index: 2, width: '22%'},
        {caption: 'Z', index: 3, width: '22%'}
    ]

    const rows: DataRow[] = events.map((event, index) =>
        [formatTimeWithoutDate(event.timestamp),
            event.x.toFixed(2),
            event.y.toFixed(2),
            event.z.toFixed(2),
        ])

    return (
        <View style={{...styles.container,}}>
            <Button title={'Share and clear this data'} onPress={() => {
                createAndShareRecords(events).then(() => transactionCreator.a((executor) => executor("DELETE FROM acceleration;")));
            }}/>
            <Table header={headerColumns} data={rows} />
        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});


