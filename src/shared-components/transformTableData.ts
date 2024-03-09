import {DataRow, RowData, Cell, HeaderColumn} from "./TableTypes";
import {Result, successIfTruthy} from "../utilities/results";

type TransformCell = (row: DataRow, rowIndex: number) => (headerColumn: HeaderColumn, index: number) => Cell
type TransformRow = (header: HeaderColumn[]) => (row: DataRow, index: number) => Result<string, RowData>

const transformCell: TransformCell = (row, rowIndex) => ({width}, index) =>
    ({value: row[index], key: `cell-${rowIndex}-${index}`, width})

export const transformRow: TransformRow = (header) => (row, index) =>
    successIfTruthy(row.length == header.length)
        .map(_ => ({cells: header.map(transformCell(row, index))}))
