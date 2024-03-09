import {DimensionValue} from "react-native";
import {ReactNode} from "react";

export type TableProps = {
    header: HeaderColumn[],
    data: DataRow[]
}

export type DataRow = ReactNode[]

export type HeaderColumn = {
    caption: string,
    index: number,
    width?: DimensionValue
}

export type RowData = {
    cells: Cell[]
}

export type Cell = {
    value: ReactNode,
    key: string,
    width?: DimensionValue
}
