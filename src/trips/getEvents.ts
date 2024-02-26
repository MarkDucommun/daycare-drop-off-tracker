import {extractRowsDataForType} from "../utilities/rowMapper";
import {ExecuteSQL, InTransaction} from "../utilities/databaseAccess";
import {AsyncResult, flatMap, flatten, Result, successIfTruthy, traverse} from "../utilities/results";

type EventRow = {
    id: number
    trip_id: number
    state: string
    timestamp: number
    order: number
    route_id: number | null
    location_id: number | null
}

const extractEventData = extractRowsDataForType<EventRow, keyof EventRow>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'trip_id', type: 'number', nullable: false},
    {key: 'state', type: 'string', nullable: false},
    {key: 'timestamp', type: 'number', nullable: false},
    {key: 'order', type: 'number', nullable: false},
    {key: 'route_id', type: 'number', nullable: true},
    {key: 'location_id', type: 'number', nullable: true}
)

export type AllEventData = EventData | EventLocationData | EventRouteData

type AddAllEventDataToAllData = (allData: AllData) => (allEventData: AllEventData[]) => AllData
export const addAllEventDataToAllData: AddAllEventDataToAllData = (allData) => (events) => {
    const eventRoutesData = events.filter(it => 'route_id' in it).map(it => it as EventRouteData)
    const eventsLocationData = events.filter(it => 'location_id' in it).map(it => it as EventLocationData)
    const eventsData = events.filter(it => 'timestamp' in it).map(it => it as EventData)
    return {
        ...allData,
        eventRoutesData,
        eventLocationsData: eventsLocationData,
        eventsData
    }
}

export const geEvents = (tripId: number): InTransaction<Array<AllEventData>> =>
    (executor, pushOnRollback, logger) =>
        executor(`SELECT e.*, l.location_id, r.route_id
                  FROM events e
                           LEFT JOIN event_locations l ON e.id = l.event_id
                           LEFT JOIN event_routes r ON e.id = r.event_id
                  WHERE e.trip_id = ?`, [tripId])
            .then(flatMap(extractEventData()))
            .then(flatMap(transformEventRowsToAllEventData))

export const getEvents = (execute: ExecuteSQL) => async (tripId: number): AsyncResult<Array<AllEventData>> =>
    execute(`SELECT e.*, l.location_id, r.route_id
             FROM events e
                      LEFT JOIN event_locations l ON e.id = l.event_id
                      LEFT JOIN event_routes r ON e.id = r.event_id
             WHERE e.trip_id = ?`, [tripId])
        .then(flatMap(extractEventData()))
        .then(flatMap(transformEventRowsToAllEventData))

const transformEventRowsToAllEventData = (events: Array<EventRow>): Result<string, Array<AllEventData>> =>
    traverse(events.flatMap(eventRowToAllEventData)).map(flatten)

export const eventRowToAllEventData = (eventRow: EventRow): Result<string, Array<AllEventData>> => {
    const {eventData, route_id, location_id, event_id} = eventRowToEventRowData(eventRow)

    return successIfTruthy(!route_id && !location_id).map((_) => [eventData as AllEventData])
        .flatMapError(_ => successIfTruthy(!location_id).map((_): Array<AllEventData> => [eventData, {
            route_id: route_id!,
            event_id
        }]))
        .flatMapError(_ => successIfTruthy(!route_id).map((_): Array<AllEventData> => [eventData, {
            location_id: location_id!,
            event_id
        }]))
}

type EventRowData = {
    event_id: number,
    eventData: EventData,
    route_id: number | null,
    location_id: number | null
}

type EventRowToEventRowData = (eventRow: EventRow) => EventRowData
type EventRowToEventData = (eventRow: EventRow) => EventData
type EventRowToRouteLocation = (eventRow: EventRow) => Omit<EventRowData, 'eventData'>

const eventRowToEventDataa: EventRowToEventData = ({id, trip_id, state, timestamp, order}) =>
    ({id, trip_id, state, timestamp, order})
const eventRowToRoutLocation: EventRowToRouteLocation = ({route_id, location_id, id}) =>
    ({route_id, location_id, event_id: id})

const eventRowToEventRowData: EventRowToEventRowData = (eventRow) => ({
    eventData: eventRowToEventDataa(eventRow),
    ...eventRowToRoutLocation(eventRow)
})
