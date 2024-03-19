import {buildDatabaseTripStateRepository, locationIsSaved} from "../FakeTripStateRepository";
import {databaseFromFileAsync} from "../../utilities/database/BetterSQLiteDatabaseAccess";
import {flatMapAsync} from "../../utilities/results/resultCurriers";

describe('TripStateRepository', () => {
    describe("currentTrip", () => {
        test("with multiple saved trips returns the most recent", async () => {

            const databaseResult = await databaseFromFileAsync(":memory:");
            const repositoryResult = await buildDatabaseTripStateRepository(databaseResult.forceGet())
            const repository = repositoryResult.forceGet()

            const saveTrips = await repository.save({
                type: "trip-state-with-origin",
                locations: ["Home"],
                origin: "Home"
            }).then(flatMapAsync((trip) => {
                return repository.save({
                    type: "trip-state-with-origin",
                    locations: [...trip.locations, "Work"],
                    origin: "Work"
                })
            }))

            saveTrips.forceGet()

            const currentTripResult = await repository.currentTrip()
            const currentTrip = currentTripResult.forceGet()

            expect(currentTrip).not.toBeNull()

            expect(currentTrip && 'origin' in currentTrip!! && typeof currentTrip.origin === 'object' && currentTrip.origin.name).toBe("Work")
            expect(currentTrip && currentTrip.type).toEqual("trip-state-with-saved-origin")
            expect(currentTrip && currentTrip.locations.filter(locationIsSaved).map(it => it.name)).toEqual(["Home", "Work"])
        })

        test("does not return a cancelled trip if it is most recent", async () => {

            const databaseResult = await databaseFromFileAsync(":memory:");
            const repositoryResult = await buildDatabaseTripStateRepository(databaseResult.forceGet())
            const repository = repositoryResult.forceGet()

            const saveTrips = await repository.save({
                type: "trip-state-with-origin",
                locations: ["Home"],
                origin: "Home"
            }).then(flatMapAsync((trip) => {
                return repository.save({
                    type: "trip-state-with-origin",
                    locations: [...trip.locations, "Work"],
                    origin: "Work",
                })
            })).then(flatMapAsync((trip) => {
                return repository.save({...trip, cancelled: true})
            }))

            saveTrips.forceGet()

            const currentTripResult = await repository.currentTrip()
            const currentTrip = currentTripResult.forceGet()

            expect(currentTrip).not.toBeNull()

            expect(currentTrip && 'origin' in currentTrip!! && typeof currentTrip.origin === 'object' && currentTrip.origin.name).toBe("Home")
            expect(currentTrip && currentTrip.type).toEqual("trip-state-with-saved-origin")
            expect(currentTrip && currentTrip.locations.filter(locationIsSaved).map(it => it.name)).toEqual(["Home", "Work"])
        })

        test("with only locations returns a trip with no origin", async () => {

            const databaseResult = await databaseFromFileAsync(":memory:");
            const repositoryResult = await buildDatabaseTripStateRepository(databaseResult.forceGet())
            const repository = repositoryResult.forceGet()

            const saveResult = await repository.save({
                type: "trip-state-without-origin",
                locations: ["Home", "Work"]
            })

            saveResult.forceGet()

            const currentTripResult = await repository.currentTrip()

            expect(currentTripResult.isSuccess()).toBeTruthy()

            const currentTrip = currentTripResult.forceGet()

            expect(currentTrip && currentTrip.locations.filter(locationIsSaved).map(it => it.name)).toEqual(["Home", "Work"])
        })

        test("with no saved trips returns null", async () => {

            const databaseResult = await databaseFromFileAsync(":memory:");
            const repositoryResult = await buildDatabaseTripStateRepository(databaseResult.forceGet())
            const repository = repositoryResult.forceGet()

            const currentTripResult = await repository.currentTrip()

            expect(currentTripResult.isSuccess()).toBeTruthy()

            const currentTrip = currentTripResult.forceGet()

            expect(currentTrip).toBeNull()
        })
    })

    describe("summarizeAllTrips", () => {
        test("returns all the trips", async () => {

            const databaseResult = await databaseFromFileAsync(":memory:");
            const repositoryResult = await buildDatabaseTripStateRepository(databaseResult.forceGet())
            const repository = repositoryResult.forceGet()

            const saveTrips = await repository.save({
                type: "trip-state-with-origin",
                locations: ["Home"],
                origin: "Home"
            }).then(flatMapAsync((trip) => {
                return repository.save({
                    type: "trip-state-with-origin",
                    locations: [...trip.locations, "Work"],
                    origin: "Work",
                })
            })).then(flatMapAsync((trip) => repository.save({...trip, cancelled: true})))

            saveTrips.forceGet()

            const summarizeAllTripsResult = await repository.summarizeAllTrips()
            const currentTrip = summarizeAllTripsResult.forceGet()

            expect(currentTrip).not.toBeNull()

            expect(currentTrip).toHaveLength(4)
        })
    })
})
