import {InTransaction, simpleMigration, TransactionCreator} from "../../utilities/databaseAccess";
import {AccelerationEvent} from "../useAcceleration";
import {
    AsyncResult,
    failure,
    failureIfTruthy,
    flatMap,
    flatMapAsync,
    map,
    success,
    toNull,
    traverse
} from "../../utilities/results";
import {extractRowsDataForType} from "../../utilities/rowMapper";
import {extractorQueryAll} from "../../utilities/extractorQuery";

export type RawEvent = { timestamp: number, data: string }
export type Event = { timestamp: number, x: number, y: number, z: number }

export type AccelerationSummary = {
    type: 'go' | 'stop',
    timestamp: number,
    correlationId: number,
    details: InTransaction<Array<AccelerationEvent>>
}

type AccelerationSummaryRaw = {
    correlation_id: number,
    type: string,
    timestamp: number
}

export type AccelerationRepository = {
    listAccelerations: () => AsyncResult<Array<AccelerationSummary>>
    getAccelerationDetails: (correlationId: number) => AsyncResult<Array<AccelerationEvent>>
}

type BuildAccelerationRepository = (transactionCreator: TransactionCreator) => AsyncResult<AccelerationRepository>

type BuildAccelerationRepositoryFromFile = (fileName: string) => AsyncResult<AccelerationRepository>

extractRowsDataForType<AccelerationSummaryRaw, keyof AccelerationSummaryRaw>()

const accelerationMigration: InTransaction<null> = (executor) =>
    executor("CREATE TABLE IF NOT EXISTS acceleration_event (type TEXT);")
        .then(flatMapAsync(() => executor("CREATE TABLE IF NOT EXISTS acceleration (timestamp INTEGER, data TEXT, correlation_id INTEGER);")))
        .then(map(toNull))

const accelerationMigrationToo = simpleMigration(
    `create table if not exists acceleration_event
     (
         id        integer primary key not null,
         type      text                not null,
         timestamp integer             not null
     );`,
    `create table if not exists acceleration
     (
         timestamp integer not null,
         data      text    not null,
         foreign key (correlation_id) references acceleration_event (id)
     )`
)

const listAccelerations: InTransaction<AccelerationSummary[]> = (executor, pushOnRollback, logger) => {
    logger.info("BLAH")
    return extractorQueryAll<AccelerationSummaryRaw, keyof AccelerationSummaryRaw>(`
                SELECT correlation_id, type, MAX(timestamp) AS latest_timestamp
                FROM acceleration
                GROUP BY correlation_id;
        `,
        [],
        {
            key: 'type',
            type: 'string',
            nullable: false
        },
        {
            key: 'timestamp',
            type: 'number',
            nullable: false
        },
        {
            key: 'correlation_id',
            type: 'number',
            nullable: false
        })(executor, pushOnRollback, logger).then(flatMap((accelerationSummaries) => {
        const summaries = accelerationSummaries.map(({type, timestamp, correlation_id}) => {
            if (type !== 'go' && type !== 'stop')
                return failure<string, AccelerationSummary>("Invalid type")
            logger.info("BLAHOrA")

            return success<string, AccelerationSummary>({
                type,
                timestamp,
                correlationId: correlation_id,
                details: getAccelerationDetails(correlation_id)
            })
        })

        return traverse(summaries)
    }))
}

const getAccelerationDetails: (correlationId: number) => InTransaction<Array<AccelerationEvent>> = (correlationId) =>
    (executor1, pushOnRollback1, logger1) => {
        return extractorQueryAll<RawEvent, keyof RawEvent>(
            ` SELECT timestamp, data
              FROM acceleration
              WHERE correlation_id = ?;`,
            [correlationId],
            {
                key: 'data',
                type: 'string',
                nullable: false
            }, {
                key: 'timestamp',
                type: 'number',
                nullable: false
            })(executor1, pushOnRollback1, logger1)
            .then(flatMap((rawEvents) => {
                const events = rawEvents.map(rawEvent => {
                    return failureIfTruthy<any[]>(it => it.length !== 3, "Invalid data format")
                    (success(rawEvent.data.split(',')))
                        .flatMap(it => {
                            const x = parseFloat(it[0])
                            const y = parseFloat(it[1])
                            const z = parseFloat(it[2])
                            if (Number.isNaN(x) || Number.isNaN(y) || Number.isNaN(z)) return failure<string, AccelerationEvent>("Couldn't parse data")

                            return success({timestamp: rawEvent.timestamp, data: {x, y, z}})
                        })
                })
                return traverse(events)
            }))
    }


export const buildAccelerationRepository: BuildAccelerationRepository = async (transactionCreator) =>
    transactionCreator(accelerationMigration)
        .then(map(() => ({
            listAccelerations: () => transactionCreator(listAccelerations),
            getAccelerationDetails: async (correlationId) => transactionCreator(getAccelerationDetails(correlationId))
        })))
