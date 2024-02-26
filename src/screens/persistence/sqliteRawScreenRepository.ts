import {createRawScreenRepository, RawScreenRepository} from "./rawScreenRepository";
import * as SQLite from "expo-sqlite";


export const rawScreenRepository = createRawScreenRepository(SQLite.openDatabase("appManager.db"))
