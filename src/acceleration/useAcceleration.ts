import {Logger} from "../utilities/logger";
import {Accelerometer} from "expo-sensors";
import {AsyncResult, flatMap, flatMapAsync, map, success, toNull, traverse2} from "../utilities/results";
import {InTransaction, TransactionCreator} from "../utilities/databaseAccess";
import {extractInsertId} from "../utilities/rowMapper";

export type Acceleration = {
    x: number,
    y: number,
    z: number
}

export type AccelerationEvent = {
    timestamp: number,
    data: Acceleration
}

type Listen = (acceleration: Acceleration) => void
type Unsubscribe = () => void

type AccelerationListener = {
    subscribe: (listener: Listen, frequency: number, precision?: number) => Unsubscribe,
}

export const useAccelerationListener = (parentLogger?: Logger): AccelerationListener => ({
    subscribe: (listener: Listen, frequency: number, precision?: number) => {
        Accelerometer.setUpdateInterval(frequency)

        return Accelerometer.addListener((data) => {
            listener(precision ? {
                x: floorToPrecision(data.x, precision),
                y: floorToPrecision(data.y, precision),
                z: floorToPrecision(data.z, precision)
            } : data)
        }).remove
    },
})

export type SaveDataForEvent = { save: (type: 'go' | 'stop') => AsyncResult<null> };

export type AccelerationSaver = (
    transactionCreator: TransactionCreator,
    durationBefore: number, durationAfter: number, sampleFrequency: number, precision?: number,
    parentLogger?: Logger,) => {
    saveDataForEvent: AsyncResult<SaveDataForEvent>,
    unsubscribe: () => void
}

type CreateAccelerationEvent = (type: 'go' | 'stop') => AsyncResult<SaveEvents>

type SaveEvents = (events: AccelerationEvent[]) => AsyncResult<null>

type AccelerationSaverCreator = (transactionCreator: TransactionCreator) => AsyncResult<CreateAccelerationEvent>

const accelerationMigration: InTransaction<null> = (executor) =>
    executor("CREATE TABLE IF NOT EXISTS acceleration_event (type TEXT);")
        .then(flatMapAsync(() => executor("CREATE TABLE IF NOT EXISTS acceleration (timestamp INTEGER, data TEXT, correlation_id INTEGER);")))
        .then(map(toNull))

const accelerationSaverCreator: AccelerationSaverCreator = (transactionCreator) => {
    return transactionCreator(accelerationMigration)
        .then(map(() =>
            (type) =>
                transactionCreator((executor) => executor("INSERT INTO acceleration_event (type) VALUES (?);", [type]))
                    .then(flatMap(extractInsertId))
                    .then(map((eventId) =>
                        (events) =>
                            transactionCreator((executor) => executor("INSERT INTO acceleration (timestamp, data, correlation_id) VALUES (?, ?, ?);", [events[0].timestamp, JSON.stringify(events[0].data), eventId]))
                                .then(map(toNull))))));
}

export const useAccelerationDataSaver: AccelerationSaver = (
    transactionCreator,
    durationBeforeSeconds,
    durationAfterSeconds,
    sampleFrequency,
    precision,
    parentLogger
) => {

    const eventsToStoreBefore = durationBeforeSeconds * 1000 / sampleFrequency
    const eventsToStoreAfter = durationAfterSeconds * 1000 / sampleFrequency
    let events: AccelerationEvent[] = new Array(eventsToStoreBefore).fill({
        timestamp: 0,
        data: {x: 0, y: 0, z: 0}
    })

    let listeners: { id: number, listener: ((d: Acceleration) => void) }[] = []
    const addListener = (listener: Listen): () => void => {
        const id = listeners.length
        listeners.push({id, listener})
        return () => {
            listeners = listeners.filter(it => it.id !== id)
        }
    }

    const addEvent = (data: Acceleration) => {
        listeners.forEach(it => it.listener(data))
        return events = [...events.slice(1), {timestamp: Date.now(), data}];
    }
    const unsubscribe = useAccelerationListener(parentLogger)
        .subscribe(addEvent, sampleFrequency, precision)

    return {
        saveDataForEvent: accelerationSaverCreator(transactionCreator).then(map(save => ({
            save: (type) => {
                const eventsToSave = [...events]
                return save(type).then(flatMapAsync((saveEvents) => {
                    const beforeEventSavePromise = saveEvents(eventsToSave)
                    const afterEventSavePromise = collectEventsAfter(addListener, eventsToStoreAfter)
                        .then((events) => saveEvents(events))

                    return Promise.all([beforeEventSavePromise, afterEventSavePromise])
                        .then(promises => traverse2(promises))
                        .then(map(toNull))
                }))
            }
        }))),
        unsubscribe
    }
}

function collectEventsAfter(addListener: (l: Listen) => () => void, eventsToStoreAfter: number): Promise<AccelerationEvent[]> {
    return new Promise((resolve) => {
        let events: AccelerationEvent[] = []
        let unsubscribe: (() => void) | null = null
        unsubscribe = addListener((acceleration) => {
            events.push({timestamp: Date.now(), data: acceleration})
            if (events.length >= eventsToStoreAfter) {
                if (unsubscribe) unsubscribe()
                resolve(events)
            }
        })
    })
}

function floorToPrecision(number: number, precision: number) {
    const factor = 10 ** precision;
    return Math.floor(number * factor) / factor;
}


