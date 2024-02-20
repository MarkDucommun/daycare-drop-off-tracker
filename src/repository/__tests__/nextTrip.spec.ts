import {
    buildEvents,
    buildInnerTrip,
    buildInnerTripState,
    buildLocations,
    buildNextTrip,
    getNextTrip
} from "../nextTrip";
import {extractKey, failure, Result, success} from "../../utilities/results";
import {EventState, NextTripWithCommit, OriginSelector, Trip, TripActionResult, TripTransaction} from "../../trip";
import {createLogger} from "../../utilities/logger";

const logger = createLogger("nextTrip.spec", "TRACE")

describe("all", () => {
    describe("buildNextTrip", () => {
        test("can build an OriginSelection trip", () => {

            const validateNextTrip = <S extends Trip, T extends Trip>(type: string, fn: (s: S) => TripActionResult<T>) =>({commit, nextTrip}: NextTripWithCommit<S>,
            ) => {
                expect(nextTrip.type).toEqual(type)

                return commit().flatMap(_ => fn(nextTrip))
            }

            type ValidateNextTrip = <S extends Trip, T extends keyof S, U extends Trip>(type: string, key: T) => (n: NextTripWithCommit<S>) => S[T] extends () => TripActionResult<U> ? TripActionResult<U> : Result<string, NextTripWithCommit<S>>

            const betterValidateNextTrip = <S extends Trip, T extends keyof S, U extends Trip>(type: string, key: T) =>({commit, nextTrip}: NextTripWithCommit<S>,
            )  => {
                expect(nextTrip.type).toEqual(type)

                const nextTripElement = nextTrip[key];

                if (typeof nextTripElement == 'function') {
                    return nextTripElement() as TripActionResult<U>
                } else {
                   return failure("wtf?") as TripActionResult<U>
                }
                // return commit().flatMap(_ => fn(nextTrip))
            }

            const logEvents = <T extends Trip>({nextTrip}: NextTripWithCommit<T>) => logger.info(nextTrip.innerTrip().events())

            getNextTrip({
                tripData: {
                    id: 1
                },
                routesData: [],
                locationsData: [],
                eventsData: [],
                eventRoutesData: [],
                eventLocationsData: []
            })
                .flatMap((trip) => {
                    expect(trip.type).toEqual("origin-selection")

                    const originSelector = trip as OriginSelector

                    expect(originSelector.locations()).toHaveLength(0)

                    return originSelector.selectOrigin("home")
                })
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('pending', t => t.start()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('moving', t => t.stoplight()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('stoplight', t => t.train()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('stopped', t => t.go()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('moving', t => t.destination()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('destination-selection', t => t.selectDestination("daycare")))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('route-selection', t => t.selectRoute("Glenview -> Lehigh")))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('at-destination', t => t.go()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('moving', t => t.destination()))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('destination-selection', t => t.selectDestination("home")))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('route-selection', t => t.selectRoute("Lehigh -> Glenview")))
                .doOnSuccess(logEvents)
                .flatMap(validateNextTrip('at-destination', t => t.complete()))
                .doOnSuccess(logEvents)
                .flatMap(({commit, nextTrip}) => {
                    expect(nextTrip.type).toEqual("complete")

                    return commit().map(() => ({commit: () => success<string, null>(null), nextTrip}))
                })
                .doOnSuccess(logEvents)
                .doOnSuccess(({nextTrip}) => logger.info(nextTrip.innerTrip().locations()))
                .doOnSuccess(({nextTrip}) => logger.info(nextTrip.innerTrip().routes({one: "home", two: "daycare"})))
                .doOnSuccess(({nextTrip}) => logger.info(nextTrip.innerTrip().routes({one: "daycare", two: "home"})))
                .doOnError((e) => {
                    throw Error("Should not have failed: " + e)
                })
        })
    })

    describe("buildInnerTrip", () => {
        test("can I use it", () => {
            buildInnerTripState({
                tripData: {
                    id: 1
                },
                routesData: [],
                locationsData: [],
                eventsData: [],
                eventRoutesData: [],
                eventLocationsData: []
            }).map(buildInnerTrip)
                .flatMap(innerTrip => {
                    return innerTrip.startTransaction().flatMap(addEvents(
                            {type: 'origin', location: 'home'},
                            'moving',
                            'stoplight',
                            'moving',
                            'destination',
                            {type: 'destination', location: 'daycare'},
                            {route: 'Glenview -> Lehigh'},
                            'moving',
                            'destination',
                            {type: 'destination', location: 'home'},
                            {route: 'Lehigh -> Glenview'},

                    ))
                })
                .doOnError((e) => {
                    throw Error("Should not have failed: " + e)
                })
        })

        const addEvent = ({addEvent}: TripTransaction, event: EventState) => () => addEvent(event)

        const addEvents = (...events: Array<EventState>) => (transaction: TripTransaction): Result<string, null> =>
            events.reduce((previousValue, event, currentIndex, array) =>
                previousValue.flatMap(addEvent(transaction, event)), success<string, null>(null))
                .flatMap(transaction.commit)

        test("routes work as expected", () => {
            buildInnerTripState({
                tripData: {
                    id: 1
                },
                routesData: [],
                locationsData: [],
                eventsData: [],
                eventRoutesData: [],
                eventLocationsData: []
            }).map(buildInnerTrip)
                .flatMap(innerTrip =>
                    innerTrip.startTransaction()
                        .flatMap(addEvents(
                                {location: 'Home', type: 'origin'},
                                'moving',
                                {location: 'Daycare', type: 'destination'},
                                {route: 'Glenview -> Lehigh'},
                                'moving',
                                {location: 'Home', type: 'origin'},
                                {route: 'Lehigh -> Glenview'},
                                'moving',
                                {location: 'Daycare', type: 'destination'},
                                {route: 'Glenview -> Lehigh'},
                            )
                        ).doOnSuccess(_ => {
                        expect(innerTrip.lastLocations()).toEqual({one: 'Home', two: 'Daycare'})
                        expect(innerTrip.routes(innerTrip.lastLocations()).map(extractKey('name'))).toEqual(['Glenview -> Lehigh'])
                    }))
        })
    })
    describe("buildInnerTripState", () => {
        test("put it all together", () => {
            buildInnerTripState({
                tripData: {
                    id: 2
                },
                routesData: [
                    {id: 1, name: 'route-one', location_one_id: 1, location_two_id: 2},
                    {id: 1, name: 'route-one-backwards', location_one_id: 2, location_two_id: 1}
                ],
                locationsData: [
                    {id: 1, name: 'location-one'},
                    {id: 2, name: 'location-two'},
                ],
                eventsData: [
                    {id: 1, trip_id: 2, state: 'origin-selection', timestamp: 0, order: 1},
                    {id: 4, trip_id: 2, state: 'moving', timestamp: 0, order: 2},
                    {id: 5, trip_id: 2, state: 'moving', timestamp: 0, order: 3},
                    {id: 6, trip_id: 2, state: 'train', timestamp: 0, order: 4},
                    {id: 7, trip_id: 2, state: 'moving', timestamp: 0, order: 5},
                    {id: 2, trip_id: 2, state: 'destination-selection', timestamp: 0, order: 6},
                    {id: 3, trip_id: 2, state: 'route-selection', timestamp: 0, order: 7},
                    {id: 8, trip_id: 2, state: 'destination', timestamp: 0, order: 8},
                    {id: 9, trip_id: 2, state: 'moving', timestamp: 0, order: 9},
                    {id: 10, trip_id: 2, state: 'destination-selection', timestamp: 0, order: 10},
                    {id: 11, trip_id: 2, state: 'route-selection', timestamp: 0, order: 11},
                    {id: 12, trip_id: 2, state: 'destination', timestamp: 0, order: 12},
                    {id: 13, trip_id: 2, state: 'complete', timestamp: 0, order: 13},
                ],
                eventLocationsData: [
                    {event_id: 1, location_id: 1},
                    {event_id: 2, location_id: 2},
                    {event_id: 10, location_id: 1}
                ],
                eventRoutesData: [
                    {event_id: 3, route_id: 1},
                    {event_id: 11, route_id: 1}
                ]
            }).map(innerTripState => {
                logger.info(innerTripState.events)
                expect(innerTripState.events).toHaveLength(13)
            })
                .mapError((e) => {
                    throw Error("Should not have failed: " + e)
                })
        })
    })

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

    describe("buildEvents", () => {
        it("can build simple events", () => {
            const allData: AllData = {
                eventLocationsData: [],
                eventRoutesData: [],
                eventsData: [
                    {id: 1, trip_id: 2, state: 'moving', timestamp: 0, order: 1},
                    {id: 6, trip_id: 2, state: 'complete', timestamp: 0, order: 6},
                    {id: 3, trip_id: 2, state: 'stoplight', timestamp: 0, order: 3},
                    {id: 4, trip_id: 2, state: 'train', timestamp: 0, order: 4},
                    {id: 2, trip_id: 2, state: 'moving', timestamp: 0, order: 2},
                    {id: 5, trip_id: 2, state: 'destination', timestamp: 0, order: 5},
                ],
                locationsData: [],
                routesData: [],
                tripData: {id: 0}
            }

            buildEvents(allData)
                .map(events => {
                    expect(events).toHaveLength(6)
                    expect(events[5]).toEqual({
                        id: 1,
                        state: 'moving',
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
            const allData: AllData = {
                eventLocationsData: [
                    {event_id: 1, location_id: 1},
                    {event_id: 2, location_id: 2}
                ],
                eventRoutesData: [{event_id: 3, route_id: 1}],
                eventsData: [
                    {id: 1, trip_id: 2, state: 'origin-selection', timestamp: 0, order: 1},
                    {id: 2, trip_id: 2, state: 'destination-selection', timestamp: 0, order: 2},
                    {id: 3, trip_id: 2, state: 'route-selection', timestamp: 0, order: 3}
                ],
                locationsData: [{id: 1, name: 'location-one'}, {id: 2, name: 'location-two'}],
                routesData: [{id: 1, name: 'route-one', location_one_id: 1, location_two_id: 2}],
                tripData: {id: 0}
            }

            buildEvents(allData)
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
})
