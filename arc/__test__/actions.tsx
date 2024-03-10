import {buildValidateTripHistoryScreen} from "./actions/buildValidateTripHistoryScreen";
import {buildValidateHomeScreen} from "./actions/buildValidateHomeScreen";


export const validateTripHistoryScreen = buildValidateTripHistoryScreen()

export const validateHomeScreen = buildValidateHomeScreen(validateTripHistoryScreen)
