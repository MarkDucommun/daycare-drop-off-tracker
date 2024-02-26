import * as SQLite from "expo-sqlite";
import {eventRowToAllEventData} from "../getEvents";

describe("All", () => {
    test("eventRowToAllEventData", () => {
        eventRowToAllEventData({
            id: 1,
            trip_id: 1,
            state: 'string',
            timestamp: 1,
            order: 1,
            route_id: null,
            location_id: null
        }).map(events => {
            expect(events).toHaveLength(1)
            expect(events[0]).toHaveProperty('id', 1)
            expect(events[0]).toHaveProperty('trip_id', 1)
        })
        eventRowToAllEventData({
            id: 1,
            trip_id: 1,
            state: 'string',
            timestamp: 1,
            order: 1,
            route_id: 1,
            location_id: null
        }).map(events => {
            expect(events).toHaveLength(2)
            expect(events[0]).toHaveProperty('id', 1)
            expect(events[0]).toHaveProperty('trip_id', 1)
            expect(events[1]).toHaveProperty('event_id', 1)
            expect(events[1]).toHaveProperty('route_id', 1)
        })
        eventRowToAllEventData({
            id: 1,
            trip_id: 1,
            state: 'string',
            timestamp: 1,
            order: 1,
            route_id: null,
            location_id: 1
        }).map(events => {
            expect(events).toHaveLength(2)
            expect(events[0]).toHaveProperty('id', 1)
            expect(events[0]).toHaveProperty('trip_id', 1)
            expect(events[1]).toHaveProperty('event_id', 1)
            expect(events[1]).toHaveProperty('location_id', 1)
        })
        eventRowToAllEventData({
            id: 1,
            trip_id: 1,
            state: 'string',
            timestamp: 1,
            order: 1,
            route_id: 1,
            location_id: 1
        }).map(events => {
            throw Error("Should not have been able to create event with both route and location")
        })
    })
})
