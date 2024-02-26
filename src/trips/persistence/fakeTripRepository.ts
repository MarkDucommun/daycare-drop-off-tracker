import {success, todo} from "../../utilities/results";
import {TripRepository} from "../../tripTypes";
import {getNextTrip} from "../nextTrip";
import {BuildTripRepository} from "./tripRepository";

export const fakeTripRepository: TripRepository = {
    nextTrip: async () => {
        return getNextTrip({
            tripData: {
                id: 1
            },
            routesData: [
                {id: 1, name: 'Glenview -> Lehigh', location_one_id: 1, location_two_id: 2},
                {id: 2, name: 'Lehigh -> Glenview', location_one_id: 2, location_two_id: 1}
            ],
            locationsData: [{id: 1, name: 'Home'}, {id: 2, name: 'Daycare'}],
            eventsData: [],
            eventRoutesData: [],
            eventLocationsData: []
        })
    },
    save: async () => todo(),
    lastTrip: async () => todo()
};


export const buildFakeTripRepository: BuildTripRepository = async () => {
    return success<string, TripRepository>(fakeTripRepository)
}
