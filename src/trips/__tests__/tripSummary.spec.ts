import {Event, TripSummary} from "../../tripTypes";
import {buildTripSummary, emptyDuration, emptyTripSummary} from "../innerTrip/buildTripSummary";
import {forceGet} from "../../utilities/results";

describe("tripSummaryToo", () => {
    it("returns an empty trip summary when no events are provided", () => {
        expect(forceGet(buildTripSummary([]))).toEqual(emptyTripSummary())
    })

    it("returns a failure if the first event is not an origin", () => {
        expect(buildTripSummary([{id: null, state: 'moving', timestamp: 0, order: 1}]).isFailure()).toBeTruthy()
    })

    it("allows origin as the first event", () => {
        const result = buildTripSummary([
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 10, order: 1}
        ]);
        expect(forceGet(result)).toEqual({...emptyTripSummary(),
            startTime: {trip: 10, lastLeg: 10, lastEvent: 10},
        })
    })

    it("origin -> moving", () => {
        const result = buildTripSummary([
            {id: null, state: {location: 'home', type: "origin"}, timestamp: 10, order: 1},
            {id: null, state: 'moving', timestamp: 20, order: 2}
        ]);
        expect(forceGet(result)).toEqual({...emptyTripSummary(),
            startTime: {trip: 20, lastLeg: 20, lastEvent: 20},
            duration: { ...emptyDuration(), origin: 10 }
        })
    })
})

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

        const result = buildTripSummary(events);
        expect(result.isSuccess()).toBeTruthy()

        const summary = forceGet(result)

        expect(summary.duration.moving).toEqual(10)
        expect(summary.count.destination).toEqual(1)
        expect(summary.startTime.lastEvent).toEqual(20)
    })
})
