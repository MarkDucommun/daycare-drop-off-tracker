import {extractRowsDataForType} from "../utilities/rowMapper";
import {ExecuteSQL, InTransaction} from "../utilities/databaseAccess";
import {Logger} from "../utilities/logger";
import {doOnSuccess, flatMap, Result} from "../utilities/results";

const locationRowsExtractor = extractRowsDataForType<LocationData, keyof LocationData>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'name', type: 'string', nullable: false}
)
export const getLocations: InTransaction<Array<LocationData>> = (execute, _, logger) =>
    execute("select * from locations")
        .then(flatMap(locationRowsExtractor()))
        .then(doOnSuccess(locations => logger.debug(`GOT ${locations.length} LOCATIONS`)))
        .then(doOnSuccess(locations => logger.trace(`LOCATIONS RETRIEVED:`)))
        .then(doOnSuccess(locations => logger.trace(locations)))
