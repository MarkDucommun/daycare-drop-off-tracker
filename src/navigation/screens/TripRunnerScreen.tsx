import React, {useContext, useEffect, useState} from "react";
import {NativeStackScreenProps} from "@react-navigation/native-stack/src/types";
import {RootStackParams} from "../screenTypes";
import {createLoggerFromParent} from "../../utilities/logger";
import {LoggerContext} from "../../LoggerContext";
import {StyleSheet, View} from "react-native";
import {TripRepositoryContext} from "../../trips/persistence/TripRepositoryContext";
import {TripRunner} from "../../TripRunner";
import {createTransactionCreatorForFile, TransactionCreator} from "../../utilities/databaseAccess";
import {Loading} from "../Loading";
import {SaveDataForEvent, useAccelerationDataSaver} from "../../acceleration/useAcceleration";
import {doOnSuccess} from "../../utilities/results";

export const TripRunnerScreen: React.FC<NativeStackScreenProps<RootStackParams, 'trip-runner'>> = ({navigation}) => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("trip-runner")

    const repository = useContext(TripRepositoryContext)

    const [saveAcceleration, setSaveAcceleration] = useState<SaveDataForEvent>()

    useEffect(() => {
        const dataSaver = createTransactionCreatorForFile("acceleration-events.db")
            .map(tc => useAccelerationDataSaver(tc, 5, 5, 200, undefined, logger))
            .getOrNull()

        if (dataSaver?.saveDataForEvent) {
            dataSaver.saveDataForEvent
                .then(doOnSuccess(saveAcceleration => setSaveAcceleration(saveAcceleration)))
        }

        return dataSaver?.unsubscribe ? dataSaver.unsubscribe : () => {}
    }, []);

    logger.debug("Rendering Trip Runner")

    if (!saveAcceleration) return <Loading/>

    return (<View style={styles.container}>
        <TripRunner repository={repository} parentLogger={logger} saveAccelerationToo={saveAcceleration} />
    </View>)
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

