import {doOnError, flatMapAsync, flatMapError, map, Result, success, todo, traverse} from "../utilities/results";
import {EventState, EventStateData, InnerTrip, TripTransaction} from "../tripTypes";
import {createLogger, Logger} from "../utilities/logger";

type Id = number

export type SaveTrip = () => Promise<Result<string, Id>>
type SaveLocation = (name: string) => Promise<Result<string, Id>>
type SaveRoute = (name: string, locationOne: Id, locationTwo: Id) => Promise<Result<string, Id>>
type SaveEvent = (tripId: Id, state: EventStateData, timestamp: number, order: number) => Promise<Result<string, Id>>
type SaveEventLocation = (eventId: Id, locationId: Id) => Promise<Result<string, Id>>
type SaveEventRoute = (eventId: Id, routeId: Id) => Promise<Result<string, Id>>

type TripSaver = {
    saveLocation: SaveLocation,
    saveRoute: SaveRoute,
    saveEvent: SaveEvent,
    saveEventLocation: SaveEventLocation,
    saveEventRoute: SaveEventRoute
}

type SaveInnerTrip = (logger?: Logger) => (
    tripSaver: TripSaver,
    innerTrip: InnerTrip
) => Promise<Result<string, null>>

export const saveInnerTrip: SaveInnerTrip = (parentLogger) => {
    const logger = parentLogger?.createChild("saveInnerTrip", "TRACE") ?? createLogger("saveInnerTrip", "TRACE")

    return async (tripSaver, innerTrip) => {

        return success<string, TripTransaction>(innerTrip.startTransaction()).flatMapAsync((transaction) => {
            return transaction.unsavedLocations()
                .doOnSuccess(locations => logger.debug("LOCATIONS TO BE SAVED", locations))
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
                                        return event.getEventId().map(eventId => ({eventId}))
                                            .flatMap(args => event.getRouteId().map(routeId => ({...args, routeId})))
                                            .flatMapAsync(({
                                                               eventId,
                                                               routeId
                                                           }) => tripSaver.saveEventRoute(eventId, routeId))
                                            .then(map(_ => null))
                                    }
                                    if (event.type == 'location') {
                                        return event.getEventId().map(eventId => ({eventId}))
                                            .flatMap(args => event.getLocationId().map(locationId => ({
                                                ...args,
                                                locationId
                                            })))
                                            .flatMapAsync(({
                                                               eventId,
                                                               locationId
                                                           }) => tripSaver.saveEventLocation(eventId, locationId))
                                            .then(map(_ => null))
                                    }

                                    return Promise.resolve(success<string, null>(null))
                                }))
                        })

                        return Promise.all(eventPromises).then(traverse).then(map(_ => null))
                    })
                }))
                .then(doOnError(logger.error))
                .then(flatMapError(transaction.rollback))
        })
    };
}
