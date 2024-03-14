import {buildValidateTripHistoryScreen} from "./actions/ValidateTripHistoryScreen";
import {buildValidateHomeScreen} from "./actions/ValidateHomeScreen";
import {buildValidateTripTrackerScreen} from "./actions/ValidateTripTrackerScreen";


export const validateTripHistoryScreen = buildValidateTripHistoryScreen()
export const validateTripTrackerScreen = buildValidateTripTrackerScreen()

export const validateHomeScreen = buildValidateHomeScreen(
    validateTripHistoryScreen,
    validateTripTrackerScreen
)
