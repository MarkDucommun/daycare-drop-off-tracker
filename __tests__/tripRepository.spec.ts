import {getTripRepository} from "../src/tripRepository";
import * as SQLite from "expo-sqlite";

describe("can play around with a trip repository", () => {
    test("can load routes", () => {
        const testDb = new SQLite.SQLiteDatabase('test.db');

        const tripRepository = getTripRepository(testDb);

        expect(tripRepository.getRoutes()).toEqual(["Lake-Chestnut", "Glenview-Lehigh"] )
    })
})
