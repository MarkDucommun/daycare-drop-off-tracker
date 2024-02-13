import {buildEvents, buildLocations, buildRoutes} from "../nextTrip";

describe("buildLocations", () => {
    test("when no locations data passed in, returns empty list", () => {
        buildLocations([])
            .map(locations => expect(locations).toEqual([]))
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })

    test("converts location data passed in", () => {
        buildLocations([{
            id: 1,
            name: "location"
        }])
            .map(locations => expect(locations).toContainEqual({name: "location"}))
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })
})

describe("buildRoutes", () => {
    test("retrieves saved routes", () => {
        buildRoutes([{id: 1, name: 'test', location_one_id: 1, location_two_id: 2}],
            [{id: 1, name: 'one'}, {id: 2, name: 'two'}])
            .map(innerRoutes => innerRoutes.forLocations({one: 'one', two: 'two'}))
            .map(routes => expect(routes).toContainEqual({id: 1, name: 'test'}))
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })

    test("adds new unsaved routes and adds them to saved routes once saved", () => {
        buildRoutes([], [])
            .map(innerRoutes => {
                innerRoutes.add({locationOne: "one", locationTwo: "two", name: "route-name"})

                const unsavedRoutes = innerRoutes.unsaved();

                expect(unsavedRoutes).toHaveLength(1)
                expect(unsavedRoutes[0].name).toEqual("route-name")
                expect(unsavedRoutes[0].locationOne).toEqual("one")
                expect(unsavedRoutes[0].locationTwo).toEqual("two")

                expect(innerRoutes.forLocations({one: "one", two: "two"})).toHaveLength(0)

                unsavedRoutes[0].setRouteId(1)

                expect(innerRoutes.unsaved()).toHaveLength(0)

                const updatedRoutesForLocation = innerRoutes.forLocations({one: "one", two: "two"});

                expect(updatedRoutesForLocation).toHaveLength(1)
                expect(updatedRoutesForLocation[0].id).toEqual(1)
                expect(updatedRoutesForLocation[0].name).toEqual("route-name")
            })
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })
})

describe("buildEvents", () => {
    it("can build simple events", () => {
        buildEvents([], [], [
            {id: 1, trip_id: 2, state: 'pending', timestamp: 0, order: 1},
            {id: 6, trip_id: 2, state: 'complete', timestamp: 0, order: 6},
            {id: 3, trip_id: 2, state: 'stoplight', timestamp: 0, order: 3},
            {id: 4, trip_id: 2, state: 'train', timestamp: 0, order: 4},
            {id: 2, trip_id: 2, state: 'moving', timestamp: 0, order: 2},
            {id: 5, trip_id: 2, state: 'destination', timestamp: 0, order: 5},

        ], [], [])
            .map(events => {
                expect(events).toHaveLength(6)
                expect(events[5]).toEqual({
                    id: 1,
                    state: 'pending',
                    timestamp: 0,
                    order: 1
                })
                expect(events[0]).toEqual({
                    id: 6,
                    state: 'complete',
                    timestamp: 0,
                    order: 6
                })
            })
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })

    it("can build complex events", () => {
        buildEvents([
            {id: 1, name: 'route-one', location_one_id: 1, location_two_id: 2}
        ], [
            {id: 1, name: 'location-one'},
            {id: 2, name: 'location-two'},
        ], [
            {id: 1, trip_id: 2, state: 'origin-selection', timestamp: 0, order: 1},
            {id: 2, trip_id: 2, state: 'destination-selection', timestamp: 0, order: 2},
            {id: 3, trip_id: 2, state: 'route-selection', timestamp: 0, order: 3},
        ], [
            {id: 1, event_id: 1, location_id: 1},
            {id: 2, event_id: 2, location_id: 2}
        ], [
            {id: 1, event_id: 3, route_id: 1}
        ])
            .map(events => {
                expect(events).toHaveLength(3)
                expect(events[0]).toEqual({
                    id: 3,
                    state: {
                        route: 'route-one'
                    },
                    timestamp: 0,
                    order: 3
                })
                expect(events[1]).toEqual({
                    id: 2,
                    state: {
                        type: 'destination',
                        location: 'location-two'
                    },
                    timestamp: 0,
                    order: 2
                })
                expect(events[2]).toEqual({
                    id: 1,
                    state: {
                        type: 'origin',
                        location: 'location-one'
                    },
                    timestamp: 0,
                    order: 1
                })
            })
            .mapError((e) => {
                throw Error("Should not have failed: " + e)
            })
    })
})