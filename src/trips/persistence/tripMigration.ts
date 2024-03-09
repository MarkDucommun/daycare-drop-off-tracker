import {InTransaction, simpleMigration} from "../../utilities/databaseAccess";
import {flatMapAsync, map, Result, success, toNull} from "../../utilities/results";

// TODO probably insert some logs?
const ensureTablesExistOld: InTransaction<null> = (execute, _, logger): Promise<Result<string, null>> => execute("PRAGMA foreign_keys = ON;")
    .then(flatMapAsync(_ => execute("create table if not exists locations (id integer primary key not null, name text unique);")))
    .then(flatMapAsync(_ => execute("create index if not exists location_name_index ON locations(name);")))

    .then(flatMapAsync(_ => execute("create table if not exists routes (id integer primary key not null, name text unique, location_one_id integer, location_two_id integer,foreign key (location_one_id) references locations(id), foreign key (location_two_id) references locations(id));")))
    .then(flatMapAsync(_ => execute("create index if not exists route_name_location_one_and_two_index ON routes(name, location_one_id, location_two_id);")))

    .then(flatMapAsync(_ => execute("create table if not exists trips (id integer primary key not null);")))

    .then(flatMapAsync(_ => execute("create table if not exists events (id integer primary key not null, trip_id integer not null, state text not null, timestamp integer not null, \"order\" integer not null, foreign key (trip_id) references trips(id));")))
    .then(flatMapAsync(_ => execute("create index if not exists events_timestamp_index ON events(trip_id desc, timestamp desc);")))
    .then(flatMapAsync(_ => execute("create index if not exists events_order_index ON events(trip_id desc, \"order\" desc);")))

    .then(flatMapAsync(_ => execute("create table if not exists event_locations (id integer primary key not null, event_id integer not null, location_id integer not null, foreign key (event_id) references events(id), foreign key (location_id) references locations(id));")))
    .then(flatMapAsync(_ => execute("create index if not exists event_locations_event_id_index ON event_locations(event_id desc);")))

    .then(flatMapAsync(_ => execute("create table if not exists event_routes (id integer primary key not null, event_id integer not null, route_id integer not null, foreign key (event_id) references events(id), foreign key (route_id) references routes(id));")))
    .then(flatMapAsync(_ => execute("create index if not exists event_routes_event_id_index ON event_routes(event_id desc);")))

    .then(map(_ => null));

export const ensureTablesExist = simpleMigration(
    "PRAGMA foreign_keys = ON;",
    `create table if not exists locations
     (
         id   integer primary key not null,
         name text unique
     );`,
    `create index if not exists location_name_index
        ON locations (name);`,

    `create table if not exists routes
     (
         id              integer primary key not null,
         name            text unique,
         location_one_id integer,
         location_two_id integer,
         foreign key (location_one_id) references locations (id),
         foreign key (location_two_id) references locations (id)
     );`,
    `create index if not exists route_name_location_one_and_two_index
        ON routes (name, location_one_id, location_two_id);`,

    `create table if not exists trips
     (
         id integer primary key not null
     );`,

    `create table if not exists events
     (
         id        integer primary key not null,
         trip_id   integer             not null,
         state     text                not null,
         timestamp integer             not null,
         "order"   integer             not null,
         foreign key (trip_id) references trips (id)
     );`,
    `create index if not exists events_timestamp_index
        ON events (trip_id desc, timestamp desc);`,
    `create index if not exists events_order_index
        ON events (trip_id desc, "order" desc);`,

    `create table if not exists event_locations
     (
         id          integer primary key not null,
         event_id    integer             not null,
         location_id integer             not null,
         foreign key (event_id) references events (id),
         foreign key (location_id) references locations (id)
     );`,
    `create index if not exists event_locations_event_id_index
        ON event_locations (event_id desc);`,

    `create table if not exists event_routes
     (
         id       integer primary key not null,
         event_id integer             not null,
         route_id integer             not null,
         foreign key (event_id) references events (id),
         foreign key (route_id) references routes (id)
     );`,
    `create index if not exists event_routes_event_id_index
        ON event_routes (event_id desc);`
)
