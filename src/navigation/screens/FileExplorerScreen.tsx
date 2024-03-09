import React, {ReactNode, useEffect, useState} from "react";
import {Alert, Button, StyleSheet, View} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import {Table} from "../../shared-components/Table";
import {HeaderColumn} from "../../shared-components/TableTypes";

export const FileExplorerScreen: React.FC = () => {

    const [directory, setDirectory] = useState(FileSystem.documentDirectory!!)
    const [fileData, setFileData] = useState<ReactNode[][]>([])
    const [version, setVersion] = useState(0)

    const incrementVersion = () => setVersion(prev => prev + 1)

    useEffect(() => {
        FileSystem.readDirectoryAsync(directory).then((files) => {
            const promises = files.map((file, index) => {
                return FileSystem.getInfoAsync(directory + "/" + file).then((fileInfo) => {
                    if (fileInfo.exists) {
                        if (fileInfo.isDirectory) {
                            return [<Button onPress={() => setDirectory(fileInfo['uri'])} title={file}/>, null, null, null]
                        } else {
                            return [file, fileInfo.size, <Button onPress={() => {
                                    Alert.alert('Delete file?', file, [
                                        {
                                            text: 'Cancel',
                                            onPress: () => console.log('Cancelled'),
                                            style: 'cancel',
                                        },
                                        {text: 'OK', onPress: () => FileSystem.deleteAsync(fileInfo.uri).then(incrementVersion)},
                                    ]);
                            }} title="Del"/>, <Button onPress={() => {
                                Sharing.shareAsync(fileInfo.uri, {mimeType: 'text/plain', dialogTitle: 'Share this file'}).then()
                            }} title="Share"/>]
                        }
                    } else {
                        return [null, null, null, null]
                    }
                })
            })

            Promise.all(promises).then(setFileData)
        })
    }, [directory, version]);

    const header: HeaderColumn[] = [
        {caption: "Name", index: 0, width: '50%'},
        {caption: "Bytes", index: 1, width: '15%'},
        {caption: "Actions", index: 2, width: '20%'},
        {caption: "", index: 3, width: '15%'},
    ]

    const finalData = directory === FileSystem.documentDirectory!! ?
        fileData :
        [[<Button onPress={() => setDirectory(directory + "/..")} title=".."/>, null, null, null], ...fileData]

    return (
        <View style={{...styles.container,}}>
            <Table header={header} data={finalData}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
