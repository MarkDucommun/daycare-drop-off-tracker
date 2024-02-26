import {BuildRawScreenRepository} from "../../screens/persistence/rawScreenRepository";
import {AsyncResult, success, todo} from "../../utilities/results";
import {ResultSet} from "expo-sqlite";
import {Row} from "../../utilities/databaseAccess";
import {
    BuildRawTripRepository,
    CreateTripTransaction, GetRetrieveTripTransaction,
    RawTripRepository,
    RetrieveTripTransaction, TripIdAndState
} from "./rawTripRepository";
import {AllEventData} from "../getEvents";
import {Location} from "../../tripTypes";

export const rawTripRepository: BuildRawTripRepository = (parentLogger) => {

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
                    return todo()
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
                    return todo()
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
            tripData.sort((a, b) => a.id - b.id)
            return todo()
        },
        async setup(): AsyncResult<null> {
            return todo()
        }
    }

    return tripRepo
}