export type TimeProvider = {
    currentTime: () => number
    runOnInterval: (fn: () => void, intervalMillis: number) => ClearInterval
}

type ClearInterval = () => void

type TimeController = {
    setNow: (time: number) => void
    executeInterval: () => void
}

type ControllableTimeProvider = {
    timeProvider: TimeProvider,
    timeController: TimeController
}

export const createControllableTimeProvider = (now: number = 0): ControllableTimeProvider => {
    let time = now
    let intervals: { [key: string]: () => void } = {}

    return {
        timeProvider: {
            currentTime: () => time,
            runOnInterval: (fn: () => void, intervalMillis: number) => {
                const key = `${Math.random()}`
                intervals[key] = fn
                return () => {
                    delete intervals[key]
                }
            }
        },
        timeController: {
            setNow: (newTime: number) => {
                time = newTime
            },
            executeInterval: () => {
                Object.values(intervals).forEach(fn => fn())
            }
        }
    }
}

export const createTimeProvider = (): TimeProvider => ({
    currentTime: () => Date.now(),
    runOnInterval: (fn: () => void, intervalMillis: number) => {
        const interval = setInterval(fn, intervalMillis)
        return () => clearInterval(interval)
    }
})
