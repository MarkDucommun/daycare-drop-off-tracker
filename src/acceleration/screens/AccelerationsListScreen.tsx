import {Loading} from "../../navigation/Loading";
import React, {useContext, useEffect, useState} from "react";
import {AccelerationRepositoryContext} from "../persistence/AccelerationRepositoryContext";
import {doOnSuccess} from "../../utilities/results";
import {AccelerationSummary} from "../persistence/AccelerationRepository";
import {StyleSheet, View} from "react-native";
import {Table} from "../../shared-components/Table";
import {DataRow, HeaderColumn} from "../../shared-components/TableTypes";
import {formatTimeWithoutDate} from "../../utilities/time";

export const AccelerationsListScreen: React.FC = () => {

    const accelerationRepository = useContext(AccelerationRepositoryContext)

    const [accelerations, setAccelerations] = useState<AccelerationSummary[]>()

    useEffect(() => {
        accelerationRepository.listAccelerations()
            .then(doOnSuccess(a => setAccelerations(a)))
    }, [])

    if (!accelerations) return <Loading />

    return <AccelerationList accelerations={accelerations} />
}

type AccelerationListProps = {
    accelerations: AccelerationSummary[]
}

const AccelerationList: React.FC<AccelerationListProps> = ({accelerations}) => {

    const headerColumns: HeaderColumn[] = [
        {caption: 'Time', index: 0, width: '50%'},
        {caption: 'Type', index: 1, width: '50%'},
    ]

    const rows: DataRow[] = accelerations.map((accelerationSummary) => {
        return [
            formatTimeWithoutDate(accelerationSummary.timestamp),
            accelerationSummary.type,
        ]
    })

    return <View style={{...styles.container,}}>
        <Table header={headerColumns} data={rows} />
    </View>
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
