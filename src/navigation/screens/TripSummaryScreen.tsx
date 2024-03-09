import {createLoggerFromParent} from "../../utilities/logger";
import {useContext, useEffect, useState} from "react";
import {LoggerContext} from "../../LoggerContext";
import {TripRepositoryContext} from "../../trips/persistence/TripRepositoryContext";
import {StyleSheet, Text, View} from "react-native";
import {CompletedTripSummary, CompleteTrip, TripSummary} from "../../tripTypes";
import {Result} from "../../utilities/results";
import {Loading} from "../Loading";

export const TripSummaryScreen: React.FC = () => {

    const logger = createLoggerFromParent(useContext(LoggerContext))("trip-summary")
    const repository = useContext(TripRepositoryContext)

    const [lastTrip, setLastTrip] = useState<Result<string, CompleteTrip>>()

    useEffect(() => {
        if (!lastTrip)
            repository.lastTrip()
                .then(setLastTrip)
                .catch(e => logger.error(e))
    }, []);

    if (!lastTrip) return <Loading/>

    return lastTrip
        .flatMap(it => it.summary())
        .map(it => TripSummaryView({summary: it}))
        .getOrElse(() => <View style={styles.container}><Text>No completed trips</Text></View>)
}

type TripSummaryViewProps = {
    summary: CompletedTripSummary
}

const TripSummaryView: React.FC<TripSummaryViewProps> = ({summary}) => {

    return (<View style={styles.container}>
        <Text style={{fontSize: 20}}>Last Trip Summary Screen:</Text>
        <Text>Tripped started on {formatTime(summary.startTime.trip)}</Text>
        <Text>Trip lasted {formatDuration(summary.totalDuration)} seconds</Text>
        <Text>Tripped ended on {formatTime(summary.endTime)}</Text>
        <Text>Stopped at {summary.count.destination} destinations</Text>
        <Text>Spent {formatDuration(summary.duration.destination)} seconds at destinations</Text>
        <Text>Stopped for {summary.count.stoplight} stoplights</Text>
        <Text>Spent {formatDuration(summary.duration.stoplight)} seconds waiting at stoplights</Text>
        <Text>Stopped for {summary.count.train} trains</Text>
        <Text>Spent {formatDuration(summary.duration.train)} seconds waiting at trains</Text>
    </View>)
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 100,
        flex: 1,
        alignItems: 'center',
        alignContent: 'space-between',
        justifyContent: 'space-evenly',
        objectFit: 'fill'
    },
});

const formatTime = (time: number) => {
    const dateObject = new Date(time);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZoneName: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', options);

    return dateFormatter.format(dateObject);
}

function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedDays = days > 0 ? `${days}d ` : '';
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedDays}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
