import {rawTripRepository} from "../fakeRawTripRepository";

describe("fake RawTripRepository", () => {
    test("can insert multiple trips", async () => {
        const repository = rawTripRepository()

        const trip1 = (await repository.insertTrip()).getOrNull()!!
        const trip2 = (await repository.insertTrip()).getOrNull()!!

        expect(trip1).not.toEqual(trip2)
    })

    test("can insert an event and retrieve it", async () => {
        const repository = rawTripRepository()
        const trip1 = (await repository.insertTrip()).getOrNull()!!

        const createTransaction = (await repository.getCreateTripTransaction()).getOrNull()!!

        const event1 = (await createTransaction.insertEvent(trip1, "state", 123, 1)).getOrNull()!!
        const event2 = (await createTransaction.insertEvent(trip1, "state", 124, 2)).getOrNull()!!

        expect(event1).not.toEqual(event2)

        const retrieveTransaction = (await repository.getRetrieveTripTransaction()).getOrNull()!!

        const events = (await retrieveTransaction.getEvents(trip1)).getOrNull()!!

        expect(events.length).toEqual(2)
    })
})
