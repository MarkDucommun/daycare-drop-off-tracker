import * as SQLite from "expo-sqlite";
import {createRawTripRepository} from "./rawTripRepository";

export const rawTripRepository = createRawTripRepository(SQLite.openDatabase("daycare-dropoff-v2.db"))
