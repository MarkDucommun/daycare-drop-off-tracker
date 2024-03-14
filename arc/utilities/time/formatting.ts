import {format as innerFormat} from 'date-fns';

export function format(unix: number): string {
    return innerFormat(new Date(unix), "yyyy.MM.dd HH:mm")
}

const secondMillis = 1000
const minuteMillis = 60 * secondMillis
const hourMillis = 60 * minuteMillis
const dayMillis = 24 * hourMillis

export function formatDurationShort(duration: number): string {
    const days = Math.floor(duration / dayMillis)
    const hours = Math.floor(duration % dayMillis / hourMillis)
    const minutes = Math.floor(duration % hourMillis / 60000)
    const seconds = Math.floor(duration % 60000 / 1000)

    const daysString = days === 0 ? "" : `${days}d`
    const hoursString = hours === 0 ? "" : `${hours}h`
    const minutesString = minutes === 0 ? "" : `${minutes}m`
    const secondsString = seconds === 0 ? "" : `${seconds}s`

    return [daysString, hoursString, minutesString, secondsString].join(" ").trim()
}
