export type AppStackParams = {
    'Home': undefined
    'Trip History': undefined
    'Trip Tracker': undefined
    'Trip Details': { id: number }
}

export type ScreenName = keyof AppStackParams
