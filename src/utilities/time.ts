export const formatTimeWithoutDate = (time: number) => {
    const dateObject = new Date(time);

    const options: Intl.DateTimeFormatOptions = {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZoneName: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', options);

    return dateFormatter.format(dateObject);
}

export const formatTime = (time: number) => {
    const dateObject = new Date(time);

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
        timeZoneName: 'short'
    };

    const dateFormatter = new Intl.DateTimeFormat('en-US', options);

    return dateFormatter.format(dateObject);
}

export function formatDuration(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedDays = days > 0 ? `${days}d ` : '';
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedDays}${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}
