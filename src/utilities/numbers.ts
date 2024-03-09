export function floorToPrecision(number: number, precision: number) {
    const factor = 10 ** precision;
    return Math.floor(number * factor) / factor;
}
