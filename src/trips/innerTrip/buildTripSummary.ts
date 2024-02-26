import {Event, SimpleEventState, TripSummary} from "../../tripTypes";
import {Result, success, successIfTruthy, traverseOr} from "../../utilities/results";

type BuildTripSummary = (events: Array<Event>) => TripSummary

type ValidStateTransition =
    ['origin', 'moving'] |
    ['moving', 'stoplight'] |
    ['moving', 'train'] |
    ['moving', 'destination'] |
    ['stoplight', 'moving'] |
    ['stoplight', 'train'] |
    ['train', 'moving'] |
    ['destination', 'moving'] |
    ['destination', 'complete']

type EventSummary = {
    transition: ValidStateTransition,
    duration: number,
    timestamp: number
}

type StateTransitionAggregator = { stateTransitions: EventSummary[], previous: Event | null }

type TransitionTest = (previous: Event, current: Event) => Result<string, ValidStateTransition>

type TransitionTuple =
    [(previous: Event, current: Event) => boolean, ValidStateTransition]
    | [SimpleEventState, SimpleEventState]

const transitionTuples: TransitionTuple[] = [
    [(previous, current) => current.state == 'moving' && typeof previous.state == 'object' && 'location' in previous.state && previous.state.type == 'origin', ['origin', 'moving']],
    ['moving', 'stoplight'],
    ['moving', 'train'],
    ['moving', 'destination'],
    ['stoplight', 'moving'],
    ['stoplight', 'train'],
    ['train', 'moving'],
    ['destination', 'moving'],
    ['destination', 'complete']
]
const transitionTests: TransitionTest =
    (previous, current) => {
        const valid = transitionTuples.map(([first, second]) => {
            if (typeof first == 'function') {
                return successIfTruthy(first(previous, current))
                    .map(_ => second as ValidStateTransition)
            } else {
                return successIfTruthy(previous.state == first && current.state == second)
                    .map(_ => [first, second] as ValidStateTransition)
            }
        })

        return traverseOr(valid)
            .flatMap(validTransitions => successIfTruthy(validTransitions.length == 1).map(_ => validTransitions[0]))
    }

const processTransition = (previous: Event, current: Event): Result<string, EventSummary> => {
    return transitionTests(previous, current)
        .map(transition => ({transition, duration: current.timestamp - previous.timestamp, timestamp: current.timestamp}))
}

const eventsToStateTransitions = (events: Array<Event>): Result<string, Array<EventSummary>> => {
    return events
        .filter(event => typeof event.state == 'string' || 'type' in event.state && event.state.type == 'origin')
        .reduce((result, currentValue) =>
            result.flatMap(({stateTransitions, previous}): Result<string, StateTransitionAggregator> => {
                if (previous == null) {
                    return success<string, StateTransitionAggregator>({stateTransitions: [], previous: currentValue})
                } else {
                    return processTransition(previous, currentValue)
                        .map((summary): StateTransitionAggregator => ({
                            stateTransitions: [...stateTransitions, summary],
                            previous: currentValue
                        }))
                }
            }), success<string, StateTransitionAggregator>({stateTransitions: [], previous: null}))
        .map(({stateTransitions}) => stateTransitions)
}


const increment = <T extends { [key: string]: number }, K extends keyof T>(obj: T, key: K, amount: number): T => {
    const value = obj[key]
    return {...obj, [key]: value + amount}
}

export const buildTripSummary = (events: Array<Event>): Result<string, TripSummary> => {
    return eventsToStateTransitions([...events].sort((a, b) => a.order - b.order))
        .map(stateTransitions => {
            return stateTransitions.reduce((summary, {transition, duration, timestamp}) => {
                const [first, second] = transition

                return {
                    ...summary,
                    startTime: {
                        ...summary.startTime,
                        trip: first == "origin" ? timestamp : summary.startTime.trip,
                        lastLeg: first == "origin" || first == "destination" ? timestamp : summary.startTime.lastLeg,
                        lastEvent: timestamp
                    },
                    duration: increment(summary.duration, first, duration),
                    count: second != "moving" && second != "complete" ? increment(summary.count, second, 1) : summary.count
                }
            }, emptyTripSummary())
        })
}

export const emptyTripSummary = (): TripSummary => ({
    startTime: {
        trip: 0,
        lastLeg: 0,
        lastEvent: 0
    },
    duration: {
        stoplight: 0,
        train: 0,
        origin: 0,
        destination: 0,
        moving: 0
    },
    count: {
        stoplight: 0,
        train: 0,
        destination: 0
    }
})
