import {Event, SimpleEventState, TripOverview, TripRepository} from "../../tripTypes";
import {getCompleteTrip, getNextTrip} from "../nextTrip";
import {
    AsyncResult, failure,
    failureIfTruthy,
    flatMap,
    flatMapAsync,
    flatMapErrorAsync,
    map,
    Result, success, traverse
} from "../../utilities/results";
import {saveInnerTrip} from "../save";
import {createLoggerFromParent, Logger} from "../../utilities/logger";
import {RawTripRepository, RetrieveTripTransaction} from "./rawTripRepository";

export type BuildTripRepositoryOld = () => Promise<Result<string, TripRepository>>
export type BuildTripRepository = (rawTripRepository: RawTripRepository, parentLogger?: Logger) => AsyncResult<TripRepository>

export const buildTripRepository: BuildTripRepository = (rawTripRepository, parentLogger) => {
    const logger = createLoggerFromParent(parentLogger)("tripRepo")

    const asyncRepo: AsyncResult<TripRepository> = rawTripRepository.setup()
        .then(map(_ => {

            const repo: TripRepository = {
                nextTrip: () =>
                    rawTripRepository.getTripWithMostRecentEvent()
                        .then(failureIfTruthy(({state}) => state == 'complete'))
                        .then(map(({trip_id}) => trip_id))
                        .then(flatMapErrorAsync(_ => rawTripRepository.insertTrip()))
                        .then(flatMapAsync(reetrieve(rawTripRepository)))
                        .then(flatMap(getNextTrip)),
                lastTrip: () =>
                    rawTripRepository.getMostRecentCompletedTrip()
                        .then(map(({trip_id}) => trip_id))
                        .then(flatMapAsync(reetrieve(rawTripRepository)))
                        .then(flatMap(getCompleteTrip)),
                save: trip =>
                    rawTripRepository.getCreateTripTransaction().then(flatMapAsync(t =>
                        saveInnerTrip(logger)({
                            saveEvent: t.insertEvent,
                            saveRoute: t.insertRoute,
                            saveEventLocation: t.insertEventLocation,
                            saveLocation: t.insertLocation,
                            saveEventRoute: t.insertEventRoute
                        }, trip)
                    )),
                allTrips: () => {
                    const trips: AsyncResult<TripOverview[]> = rawTripRepository.getRawTripOverviews().then(flatMap(rawTripOverviews => {

                        const trips: Result<string, TripOverview>[] = rawTripOverviews.map(rawTripOverview => {

                            const getState = (state: string): Result<string, SimpleEventState | 'origin-selection'> => {
                                switch (state) {
                                    case 'moving':
                                    case 'stoplight':
                                    case 'train':
                                    case 'destination':
                                    case 'complete':
                                    case 'origin-selection':
                                        return success(state)
                                    case 'route-selection':
                                        return success<string, SimpleEventState | 'origin-selection'>('destination')
                                    case 'destination-selection':
                                        return success<string, SimpleEventState | 'origin-selection'>('destination')
                                    default:
                                        return failure(`No matching state for ${state}`)
                                }
                            }

                            const tripOverview: Result<string, TripOverview> = getState(rawTripOverview.end_state).map(state => {
                                return {
                                    state,
                                    id: rawTripOverview.trip_id,
                                    startTime: rawTripOverview.start_timestamp,
                                    duration: rawTripOverview.end_timestamp - rawTripOverview.start_timestamp,
                                    origin: rawTripOverview.origin
                                }
                            })

                            return tripOverview
                        })

                        return traverse(trips)
                    }))

                    return trips
                }
            }

            return repo
        }))

    return asyncRepo
}

type ReetrieveTrip = (rawTripRepository: RawTripRepository) => (tripId: number) => AsyncResult<AllData>

type RetrieveTrip = (retrieveTripTransaction: RetrieveTripTransaction) => (tripId: number) => AsyncResult<AllData>

const reetrieve: ReetrieveTrip = (rawTripRepository) => (tripId) => {
    return rawTripRepository.getRetrieveTripTransaction().then(flatMapAsync(tripTransaction => {
        return retrieveTrip(tripTransaction)(tripId)
    }))
}

const retrieveTrip: RetrieveTrip = (retrieveTripTransaction) => (tripId) =>
    Promise.all([retrieveTripTransaction.getEvents(tripId), retrieveTripTransaction.getRoutes(), retrieveTripTransaction.getLocations()]).then(([a, b, c]) =>
        a.flatMap(events =>
            b.flatMap(routes =>
                c.map(locations => ({
                    eventLocationsData: events.filter(it => 'location_id' in it).map(it => it as EventLocationData),
                    eventRoutesData: events.filter(it => 'route_id' in it).map(it => it as EventRouteData),
                    eventsData: events.filter(it => 'timestamp' in it).map(it => it as EventData),
                    locationsData: locations,
                    routesData: routes,
                    tripData: {
                        id: tripId
                    }
                })))))
