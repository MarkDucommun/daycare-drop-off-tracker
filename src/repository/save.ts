import {doOnError, flatMapAsync, flatMapError, map, Result, success, todo, traverse} from "../results";
import {EventState, InnerTrip} from "../tripToo";

type Id = number

type SaveTrip = () => Promise<Result<string, Id>>
type SaveLocation = (name: string) => Promise<Result<string, Id>>
type SaveRoute = (name: string, locationOne: Id, locationTwo: Id) => Promise<Result<string, Id>>
type SaveEvent = (tripId: Id, state: string, timestamp: number, order: number) => Promise<Result<string, Id>>
type SaveEventLocation = (eventId: Id, locationId: Id) => Promise<Result<string, Id>>
type SaveEventRoute = (eventId: Id, routeId: Id) => Promise<Result<string, Id>>

type TripSaver = {
    saveLocation: SaveLocation,
    saveRoute: SaveRoute,
    saveEvent: SaveEvent,
    saveEventLocation: SaveEventLocation,
    saveEventRoute: SaveEventRoute
}

type SaveInnerTrip = (
    tripSaver: TripSaver,
    innerTrip: InnerTrip
) => Promise<Result<string, null>>

const saveInnerTrip: SaveInnerTrip = async (tripSaver, innerTrip) => {

    return innerTrip.startTransaction().flatMapAsync((transaction) => {
        return transaction.unsavedLocations()
            .flatMapAsync(locations => {
                const locationPromises = locations.map(location => {
                    return tripSaver.saveLocation(location.name).then(map(id => {
                        location.id = id;
                        return null
                    }))
                })

                return Promise.all(locationPromises).then(traverse).then(map(_ => null))
            })
            .then(flatMapAsync(_ => {
                return transaction.unsavedRoutes().flatMapAsync(unsavedRoutes => {
                    const routePromises = unsavedRoutes
                        .map(({name, locationOneId, locationTwoId, setRouteId}) => {
                            return tripSaver.saveRoute(name, locationOneId, locationTwoId).then(map(setRouteId))
                        })

                    return Promise.all(routePromises).then(traverse).then(map(_ => null))
                })
            }))
            .then(flatMapAsync(_ => {
                return transaction.unsavedEvents().flatMapAsync(unsavedEvents => {
                    const eventPromises = unsavedEvents.map(event => {

                        return tripSaver.saveEvent(innerTrip.id(), event.state, event.timestamp, event.order)
                            .then(map(event.setEventId))
                            .then(map(_ => null))
                            .then(flatMapAsync(_ => {
                                if (event.type == 'route') {

                                    return tripSaver.saveEventRoute(event.getEventId(), event.getRouteId())
                                        .then(map(_ => null))
                                }
                                if (event.type == 'location') {

                                    return tripSaver.saveEventLocation(event.getEventId(), event.getLocationId())
                                        .then(map(_ => null))
                                }

                                return Promise.resolve(success<string, null>(null))
                            }))
                    })

                    return Promise.all(eventPromises).then(traverse).then(map(_ => null))
                })
            }))
            .then(doOnError(console.log))
            .then(flatMapError(transaction.rollback))
    })
}