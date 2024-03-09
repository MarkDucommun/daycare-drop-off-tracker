import React, {useEffect, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {Subscription} from "expo-sensors/build/DeviceSensor";
import {createTransactionCreatorForFile, TransactionCreator} from "../../utilities/databaseAccess";
import {flatMapAsync, map, success, toNull} from "../../utilities/results";
import {Loading} from "../../navigation/Loading";
import {useAccelerationListener} from "../useAcceleration";

type Event = { timestamp: number, newData: { x: number, y: number, z: number } }

const accelerationSaver = (transactionCreator: TransactionCreator) => {
    let events: Event[] = []

    const saveEvents = () => {
        const eventsToSave = events
        events = []

        if (eventsToSave.length > 0) {
            transactionCreator((executor) => {

                return eventsToSave.reduce((previousValue, currentValue, currentIndex, array) => {

                    const dataString = `${currentValue.newData.x},${currentValue.newData.y},${currentValue.newData.z}`

                    return previousValue
                        .then(flatMapAsync(() => executor("INSERT INTO acceleration (timestamp, data) VALUES (?, ?)", [currentValue.timestamp, dataString])))
                        .then(map(toNull))

                }, Promise.resolve(success<string, null>(null)))
            }).then()
        }
    }

    return (event: Event) => {
        events.push(event)
        if (events.length >= 20) saveEvents()
    };
}

export const AccelerationTestScreen: React.FC = () => {

    const [subscription, setSubscription] = useState<Subscription | null>();
    const [transactionCreator, setTransactionCreator] = useState<{ a: TransactionCreator }>()
    const [events, setEvents] = useState<[number, number, number, number][]>(new Array(0).fill([0, 0, 0, 0])) // timestamp, x, y, z

    useEffect(() => {
        createTransactionCreatorForFile("acceleration.db")
            .doOnSuccess(tc => setTransactionCreator({a: tc}))
            .flatMapAsync(tc =>
                tc((executor) => executor("CREATE TABLE IF NOT EXISTS acceleration (timestamp INTEGER, data TEXT);") // x,y,z
                )).then()
    }, []);

    useEffect(() => {
        if (transactionCreator) {
            const saver = accelerationSaver(transactionCreator.a)

            return useAccelerationListener().subscribe(({x, y, z}) => {
                // saver({timestamp: Date.now(), newData: acceleration})
                setEvents(prev => {
                    if (prev.length >= 23) {
                        const [_, ...tail] = prev
                        return [...tail, [Date.now(), x, y, z]]
                    } else {
                        return [...prev, [Date.now(), x, y, z]]
                    }
                })
            }, 100, 1)
        }
    }, [transactionCreator]);

    // const _slow = () => Accelerometer.setUpdateInterval(1000);
    // const _fast = () => Accelerometer.setUpdateInterval(200);
    //
    // const _subscribe = (t: TransactionCreator) => {
    //     const filter = new LowPassFilter(.2);
    //
    //     Accelerometer.setUpdateInterval(100)
    //
    //     const saver = accelerationSaver(t)
    //
    //     setSubscription(Accelerometer.addListener((newData) => {
    //         saver({timestamp: Date.now(), newData})
    //         setEvents(prev => {
    //             if (prev.length >= 23) {
    //                 const [_, ...tail] = prev
    //                 return [...tail, [Date.now(), newData.x, newData.y, newData.z]]
    //             } else {
    //                 return [...prev, [Date.now(), newData.x, newData.y, newData.z]]
    //             }
    //         })
    //     }));
    // };

    // const _unsubscribe = () => {
    //     subscription && subscription.remove();
    //     setSubscription(null);
    // };
    //
    // useEffect(() => {
    //     if (transactionCreator) {
    //         _subscribe(transactionCreator.a);
    //     }
    //
    //     return () => _unsubscribe();
    // }, [transactionCreator]);

    if (!transactionCreator) return <Loading/>


    return (
        <View style={{...styles.container,}}>
            <View style={styles.tableHead}>
                <View style={{width: '34%'}}>
                    <Text style={styles.tableHeadCaptions}>Time</Text>
                </View>
                <View style={{width: '22%'}}>
                    <Text style={styles.tableHeadCaptions}>X</Text>
                </View>
                <View style={{width: '22%'}}>
                    <Text style={styles.tableHeadCaptions}>Y</Text>
                </View>
                <View style={{width: '22%'}}>
                    <Text style={styles.tableHeadCaptions}>Z</Text>
                </View>
            </View>
            {events.map(([timestamp, x, y, z], index) =>
                (<View key={`row-${index}`} style={styles.tableRow}>
                    <View style={{width: '34%'}}>
                        <Text style={styles.text}>{formatTime(timestamp)}</Text>
                    </View>
                    <View style={{width: '22%'}}>
                        <Text style={styles.text}>{floorToPrecision(x, 2)}</Text>
                    </View>
                    <View style={{width: '22%'}}>
                        <Text style={styles.text}>{floorToPrecision(y, 2)}</Text>
                    </View>
                    <View style={{width: '22%'}}>
                        <Text style={styles.text}>{floorToPrecision(z, 2)}</Text>
                    </View>
                </View>))}
            {/*<View style={styles.buttonContainer}>*/}
            {/*    <TouchableOpacity onPress={subscription ? _unsubscribe : () => _subscribe(transactionCreator.a)}*/}
            {/*                      style={styles.button}>*/}
            {/*        <Text>{subscription ? 'On' : 'Off'}</Text>*/}
            {/*    </TouchableOpacity>*/}
            {/*</View>*/}
        </View>
    );
}

const formatTime = (time: number) => {
    const dateObject = new Date(time);

    const options: Intl.DateTimeFormatOptions = {
        // year: 'numeric',
        // month: 'short',
        // day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZoneName: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', options);

    return dateFormatter.format(dateObject);
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontFamily: 'Menlo-Regular'
    },
    buttonContainer: {},
    button: {},
    middleButton: {},
    tableHead: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        padding: 7,
        backgroundColor: '#3bcd6b'
    },
    tableHeadCaptions: {
        fontSize: 15,
        color: 'white',
        fontFamily: 'Menlo-Regular'
    },
    tableRow: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        padding: 7,
    }
});

function floorToPrecision(number: number, precision: number) {
    const factor = 10 ** precision;
    return Math.floor(number * factor) / factor;
}

class LowPassFilter {
    private alpha: number;
    private lastX: number = 0;
    private lastY: number = 0;
    private lastZ: number = 0;

    constructor(alpha: number) {
        // alpha is a smoothing factor between 0 and 1
        this.alpha = alpha;
    }

    filter(x: number, y: number, z: number): { x: number; y: number; z: number } {
        this.lastX = floorToPrecision(this.lastX + this.alpha * (x - this.lastX), 2);
        this.lastY = floorToPrecision(this.lastY + this.alpha * (y - this.lastY), 2);
        this.lastZ = floorToPrecision(this.lastZ + this.alpha * (z - this.lastZ), 2);

        return {x: this.lastX, y: this.lastY, z: this.lastZ};
    }
}
