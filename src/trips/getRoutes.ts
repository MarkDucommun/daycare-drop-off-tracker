import {extractRowsDataForType} from "../utilities/rowMapper";
import {ExecuteSQL, InTransaction} from "../utilities/databaseAccess";
import {flatMap, Result} from "../utilities/results";

const routesDataExtractor = extractRowsDataForType<RouteData, keyof RouteData>(
    {key: 'id', type: 'number', nullable: false},
    {key: 'name', type: 'string', nullable: false},
    {key: 'location_one_id', type: 'number', nullable: false},
    {key: 'location_two_id', type: 'number', nullable: false},
)

export const getRoutes: InTransaction<Array<RouteData>> = (execute, _, logger) =>
    execute("select * from routes").then(flatMap(routesDataExtractor()))
