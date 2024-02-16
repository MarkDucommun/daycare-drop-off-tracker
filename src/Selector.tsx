import React, {useState} from "react";
import {Picker, PickerIOS} from "@react-native-picker/picker";
import {Button, StyleSheet, TextInput} from "react-native";
import {ItemValue} from "@react-native-picker/picker/typings/Picker";

type SelectorProps = {
    onConfirmSelection: (selection: ItemValue) => void
    values: Array<string>
    selectButtonText: string
    enterNewButtonText: string
    placeholderText: string
}

export const Selector: React.FC<SelectorProps> = (
    {
        values,
        selectButtonText,
        enterNewButtonText,
        placeholderText,
        onConfirmSelection
    }) => {

    const [selection, setSelection] = useState<ItemValue>();
    const [freeText, setFreeText] = useState(values.length == 0)

    const backButton = values.length > 0 ? <Button title={"Use existing"} onPress={() => setFreeText(false)}/> : <></>

    if (freeText) {
        return <>
            <TextInput style={{height: 40, width: '70%'}} textAlign={"center"} onChangeText={setSelection} placeholder={placeholderText}/>
            <Button title={selectButtonText} onPress={() => {
                if (selection) {
                    onConfirmSelection(selection)
                    setSelection("")
                }
            }}/>
            {backButton}
        </>
    } else {
        return (<>
            <PickerIOS style={styles.pickerStyles} onValueChange={setSelection} selectedValue={selection}>
                {values.map(value => (<Picker.Item value={value} label={value} key={value}/>))}
            </PickerIOS>
            <Button title={selectButtonText} onPress={() => {
                if (selection) {
                    onConfirmSelection(selection)
                    setSelection("")
                } else {
                    onConfirmSelection(values[0])
                }
            }}/>
            <Button title={enterNewButtonText} onPress={() => setFreeText(true)}/>
        </>)
    }
}

const styles = StyleSheet.create({
    pickerStyles: {
        width: '70%',
        color: 'black',
    }
});