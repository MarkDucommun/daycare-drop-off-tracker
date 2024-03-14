import {format, formatDurationShort} from "../formatting";

describe("formatting", () => {
    test("format", () => {
        expect(format(new Date(2024, 0, 13, 13).getTime())).toBe("2024.01.13 13:00")
    })

    test("formatDurationShort", () => {
        const secondMillis = 1000
        const minuteMillis = 60 * secondMillis
        const hourMillis = 60 * minuteMillis
        const dayMillis = 24 * hourMillis

        expect(formatDurationShort(1.5 * secondMillis)).toBe("1s")
        expect(formatDurationShort(15 * secondMillis)).toBe("15s")
        expect(formatDurationShort(minuteMillis)).toBe("1m")
        expect(formatDurationShort(2 * minuteMillis + 15 * secondMillis)).toBe("2m 15s")
        expect(formatDurationShort(hourMillis + 2 * minuteMillis + 15 * secondMillis)).toBe("1h 2m 15s")
        expect(formatDurationShort(dayMillis + hourMillis + 2 * minuteMillis + 15 * secondMillis)).toBe("1d 1h 2m 15s")
    })
})
