import {buildValidateTripHistoryScreen} from "./actions/ValidateTripHistoryScreen";
import {buildValidateHomeScreen} from "./actions/ValidateHomeScreen";
import {buildValidateTripTrackerScreen} from "./actions/ValidateTripTrackerScreen";
import {buildValidateTripTrackerStartScreen} from "./actions/ValidateTripTrackerStartScreen";


export const validateTripHistoryScreen = buildValidateTripHistoryScreen()

export const validateTripTrackerStartScreen = buildValidateTripTrackerStartScreen()

export const validateTripTrackerScreen = buildValidateTripTrackerScreen(
    validateTripTrackerStartScreen
)

export const validateHomeScreen = buildValidateHomeScreen(
    validateTripHistoryScreen,
    validateTripTrackerScreen
)
