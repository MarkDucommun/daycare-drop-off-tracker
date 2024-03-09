export const selectTripOverviewSql = `
    WITH start_events AS
             (SELECT trip_id, timestamp as start_timestamp
              FROM events
              WHERE state = 'moving'
                AND "order" = 2
              GROUP BY trip_id),
         origin_events AS
             (SELECT trip_id, locations.name AS origin
              FROM events
                       LEFT JOIN event_locations ON events.id = event_locations.event_id
                       LEFT JOIN locations ON event_locations.location_id = locations.id
              WHERE state = 'origin-selection'
                AND "order" = 1
              GROUP BY trip_id),
         last_events AS
             (SELECT trip_id, MAX("order"), state as end_state, timestamp as end_timestamp
              FROM events
              GROUP BY trip_id)
    SELECT last_events.trip_id, origin, start_timestamp, end_timestamp, end_state
    FROM start_events
             LEFT JOIN origin_events ON start_events.trip_id = origin_events.trip_id
             LEFT JOIN last_events ON start_events.trip_id = last_events.trip_id`
