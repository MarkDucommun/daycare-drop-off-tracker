import {buildTripSummary, emptyInnerTripState} from "../nextTrip";
import {Event} from "../../tripTypes";

describe("tripSummary", () => {
    it("a origin -> moving trip", () => {
        const events: Event[] = [
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 0, order: 1},
            {id: null, state: 'moving', timestamp: 10, order: 2},
        ]

        const summary = buildTripSummary(events).getOrNull()!!

        expect(summary.startTime.trip).toEqual(10)
        expect(summary.duration.origin).toEqual(10)
    })

    it("origin -> moving -> stoplight -> moving", () => {
        const events: Event[] = [
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 0, order: 1},
            {id: null, state: 'moving', timestamp: 10, order: 2},
            {id: null, state: 'stoplight', timestamp: 20, order: 3},
            {id: null, state: 'moving', timestamp: 30, order: 4},
        ]

        const summary = buildTripSummary(events).getOrNull()!!

        expect(summary.startTime.trip).toEqual(10)
        expect(summary.startTime.lastLeg).toEqual(10)
        expect(summary.startTime.lastEvent).toEqual(30)
        expect(summary.duration.origin).toEqual(10)
        expect(summary.duration.moving).toEqual(10)
        expect(summary.duration.stoplight).toEqual(10)
        expect(summary.count.stoplight).toEqual(1)
    })

    it("origin -> moving -> train -> moving", () => {
        const events: Event[] = [
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 0, order: 1},
            {id: null, state: 'moving', timestamp: 10, order: 2},
            {id: null, state: 'train', timestamp: 20, order: 3},
            {id: null, state: 'moving', timestamp: 30, order: 4},
        ]

        const summary = buildTripSummary(events).getOrNull()!!

        expect(summary.duration.train).toEqual(10)
        expect(summary.count.train).toEqual(1)
    })
    it("origin -> moving -> stoplight -> train", () => {
        const events: Event[] = [
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 0, order: 1},
            {id: null, state: 'moving', timestamp: 10, order: 2},
            {id: null, state: 'stoplight', timestamp: 20, order: 3},
            {id: null, state: 'train', timestamp: 30, order: 4},
        ]

        const summary = buildTripSummary(events)
            .doOnError(console.error)
            .getOrNull()!!

        expect(summary.duration.stoplight).toEqual(10)
        expect(summary.count.stoplight).toEqual(1)
        expect(summary.count.train).toEqual(1)
    })

    it("origin->moving->dest.->dest.selection->route", () => {
        const events: Event[] = [
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 0, order: 1},
            {id: null, state: 'moving', timestamp: 10, order: 2},
            {id: null, state: 'destination', timestamp: 20, order: 3},
            {id: null, state: {location: 'library', type: "destination"}, timestamp: 30, order: 4},
            {id: null, state: {route: 'fun'}, timestamp: 40, order: 5},
        ]

        const summary = buildTripSummary(events).getOrNull()!!

        expect(summary.duration.moving).toEqual(10)
        expect(summary.count.destination).toEqual(1)
        expect(summary.startTime.lastEvent).toEqual(20)
    })
})
