import {Event} from "./persistence/AccelerationRepository";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

export const createAndShareRecords = async (events: Event[]) => {

    const fileUri = FileSystem.documentDirectory + `acceleration-data-${Date.now()}.csv`
    const lines = events.map(it => `${it.timestamp},${it.x},${it.y},${it.z}`).join('\n')
    const header = "timestamp,x,y,z\n"

    try {
        await FileSystem.writeAsStringAsync(fileUri, header + lines, {encoding: FileSystem.EncodingType.UTF8});
        console.log('File created and written successfully.');

        await Sharing.shareAsync(fileUri, {mimeType: 'text/plain', dialogTitle: 'Share this file'});
    } catch (error) {
        console.error('Error creating, writing, or sharing the file:', error);
    }
}
