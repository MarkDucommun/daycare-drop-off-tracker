import {FlatList, ListRenderItemInfo, StyleSheet, Text, View} from "react-native";
import React from "react";
import {traverse} from "../utilities/results";
import {TODO} from "../navigation/Loading";
import {Cell, HeaderColumn, RowData, TableProps} from "./TableTypes";
import {transformRow} from "./transformTableData";

export const Table: React.FC<TableProps> = ({header, data}) => {
    const rowResult = traverse(data.map(transformRow(header)))

    if (rowResult.isFailure()) return <TODO message="Row processing failed, unequal number of columns per row as header" />

    return <View>
        <TableHeader columns={header}/>
        <FlatList data={rowResult.forceGet()} renderItem={renderRow}/>
    </View>
}

const TableRow: React.FC<RowData> = ({cells}) => <View style={styles.tableRow}>{cells.map(TableCell)}</View>

const TableCell: React.FC<Cell> = ({value, key, width}) =>
    <View key={key} style={{width: width || 'auto'}}>
        { typeof value != 'object' ? <Text style={styles.text}>{value}</Text> : value }
    </View>

type RenderRow = (info: ListRenderItemInfo<RowData>) => React.ReactElement

const renderRow: RenderRow = (info) => <TableRow key={`table-row-${info.index}`} {...info.item}/>

const styles = StyleSheet.create({
    text: {
        fontFamily: 'Menlo-Regular'
    },
    tableRow: {
        backgroundColor: '#fff',
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        padding: 7,
    }
});

type TableHeaderProps = {
    columns: HeaderColumn[]
}

const TableHeader: React.FC<TableHeaderProps> = ({columns}) =>
    <View style={tableHeaderStyles.tableHead}>{columns.map(TableHeaderColumn)}</View>

const TableHeaderColumn: React.FC<HeaderColumn> = ({caption, width, index}) =>
    <View key={`header-column-${index}`} style={{width: width || 'auto'}}>
        <Text style={tableHeaderStyles.tableHeadCaptions}>{caption}</Text>
    </View>

const tableHeaderStyles = StyleSheet.create({
    tableHead: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: '#ddd',
        padding: 7,
        backgroundColor: '#3bcd6b'
    },
    tableHeadCaptions: {
        fontSize: 15,
        color: 'white',
        fontFamily: 'Menlo-Regular'
    },
})
