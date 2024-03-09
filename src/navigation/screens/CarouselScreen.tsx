import React, {useEffect, useState} from "react";
import {StyleSheet, Text, View} from "react-native";

export const CarouselScreen: React.FC = () => {

    const [events, setEvents] = useState<number[]>(new Array(10).fill(0)) // timestamp, x, y, z
    const [counter, setCounter] = useState<number>(0)

    useEffect(() => {
        const interval = setInterval(() => {
            setCounter(prev => prev + 1)
        }, 1000)

        return () => clearInterval(interval)
    }, []);

    useEffect(() => {
        const newEvents = [...events, counter]

        setEvents(newEvents)

    }, [counter]);

    return (
        <View style={{...styles.container,}}>
            {events.map((number, index) => <Text key={index}>{number}</Text>)}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {},
    buttonContainer: {},
    button: {},
    middleButton: {}
});

function floorToPrecision(number: number, precision: number) {
    const factor = 10 ** precision;
    return Math.floor(number * factor) / factor;
}

class LowPassFilter {
    private alpha: number;
    private lastX: number = 0;
    private lastY: number = 0;
    private lastZ: number = 0;

    constructor(alpha: number) {
        // alpha is a smoothing factor between 0 and 1
        this.alpha = alpha;
    }

    filter(x: number, y: number, z: number): { x: number; y: number; z: number } {
        this.lastX = floorToPrecision(this.lastX + this.alpha * (x - this.lastX), 2);
        this.lastY = floorToPrecision(this.lastY + this.alpha * (y - this.lastY), 2);
        this.lastZ = floorToPrecision(this.lastZ + this.alpha * (z - this.lastZ), 2);

        return {x: this.lastX, y: this.lastY, z: this.lastZ};
    }
}
