import React from "react";
import {BaseView} from "../styles/baseView";
import {Table} from "../components/table/Table";
import {DataRow, HeaderColumn} from "../../src/shared-components/TableTypes";

export const TripHistoryScreen: React.FC = () => {
    const headerColumns: HeaderColumn[] = [
        {caption: 'Start', index: 0, width: '40%'},
        {caption: 'Origin', index: 1, width: '30%'},
        {caption: 'Duration', index: 2, width: '30%'},
    ]

    const rows: DataRow[] = [
        ["2024.01.02 8:00", "Home", "27:15"],
        ["2024.01.01 8:00", "Home", "30:00"],
    ]

    return (<BaseView>
        <Table header={headerColumns} data={rows}/>
    </BaseView>)
}
