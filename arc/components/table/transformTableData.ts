import {DataRow, RowData, Cell, HeaderColumn} from "./TableTypes";
import {Result} from "../../utilities/results/results";
import {successIfTruthy} from "../../utilities/results/resultCurriers";

type TransformCell = (row: DataRow, rowIndex: number) => (headerColumn: HeaderColumn, index: number) => Cell
type TransformRow = (header: HeaderColumn[]) => (row: DataRow, index: number) => Result<string, RowData>

const transformCell: TransformCell = (row, rowIndex) => ({width}, index) =>
    ({value: row[index], key: `cell-${rowIndex}-${index}`, width})

export const transformRow: TransformRow = (header) => (row, index) =>
    successIfTruthy(row.length == header.length)
        .map(_ => ({cells: header.map(transformCell(row, index))}))
