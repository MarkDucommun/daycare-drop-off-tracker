import {AsyncResult, failure, success, todo} from "../../utilities/results";
import {
    BuildRawTripRepository,
    CreateTripTransaction,
    RawTripRepository,
    RetrieveTripTransaction,
    TripIdAndState
} from "./rawTripRepository";
import {AllEventData} from "../getEvents";

export const rawTripRepository: BuildRawTripRepository = (parentLogger) => () => {

    const tripData: TripData[] = []
    const locations: LocationData[] = []
    const routes: RouteData[] = []
    const events: EventData[] = []
    const eventLocations: EventLocationData[] = []
    const eventRoutes: EventRouteData[] = []

    const tripRepo: RawTripRepository = {
        async getCreateTripTransaction(): AsyncResult<CreateTripTransaction> {
            const transaction: CreateTripTransaction = {
                async insertEvent(tripId: number, state: string, timestamp: number, order: number): AsyncResult<number> {
                    const nextId = lastId(events) + 1
                    if (!idExists(tripData, tripId)) return failure("trip does not exist")
                    events.push({id: nextId, trip_id: tripId, state, timestamp, order})
                    return success(nextId)
                },
                async insertEventLocation(eventId: number, locationId: number): AsyncResult<number> {
                    return todo()
                },
                async insertEventRoute(eventId: number, routeId: number): AsyncResult<number> {
                    return todo()
                },
                async insertLocation(name: string): AsyncResult<number> {
                    return todo()
                },
                async insertRoute(name: string, locationOneId: number, locationTwoId: number): AsyncResult<number> {
                    return todo()
                }
            }

            return success(transaction)
        },
        async getMostRecentCompletedTrip(): AsyncResult<TripIdAndState> {
            return todo()
        },
        async getRetrieveTripTransaction(): AsyncResult<RetrieveTripTransaction> {

            const transaction: RetrieveTripTransaction = {
                async getEventLocations(eventId: number): AsyncResult<Array<EventLocationData>> {
                    return todo();
                },
                async getEventRoutes(eventId: number): AsyncResult<Array<EventRouteData>> {
                    return todo();
                },
                async getEvents(tripId: number): AsyncResult<Array<AllEventData>> {
                    const value: AllEventData[] = events.filter(e => e.trip_id === tripId)
                    return success(value)
                },
                async getLocations(): AsyncResult<Array<LocationData>> {
                    return todo()
                },
                async getRoutes(): AsyncResult<Array<RouteData>> {
                    return todo()
                }
            }

            return success(transaction)
        },
        async getTripWithMostRecentEvent(): AsyncResult<TripIdAndState> {
            return todo()
        },
        async insertTrip(): AsyncResult<number> {
            const nextId = lastId(tripData) + 1
            tripData.push({id: nextId})
            return success(nextId)
        },
        async setup(): AsyncResult<null> {
            return todo()
        }
    }

    return tripRepo
}

const lastId = <T extends { id: number }>(data: T[]): number => data.sort((a, b) => b.id - a.id)[0]?.id ?? 0

const idExists = <T extends { id: number }>(data: T[], id: number): boolean => data.some(d => d.id === id)
