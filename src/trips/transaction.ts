import {failure, Result, success, todoFn, traverse} from "../utilities/results";
import {Event, InnerTripState, LocationPair, LocationState, TripTransaction} from "../tripTypes";
import {Logger} from "../utilities/logger";
import {deepCopyInnerTripState} from "./innerTrip/innerTripStateUtilities";
import {addEvent} from "./transaction/addEvent";
import {unsavedRoutes} from "./transaction/unsavedRoutes";
import {unsavedEvents} from "./transaction/unsavedEvents";

export type StartTripTransaction = (
    currentState: InnerTripState,
    startTransaction: (transaction: TripTransaction) => void,
    commitTransaction: (nextState: InnerTripState) => Result<string, null>
) => TripTransaction

export const startTripTransaction: StartTripTransaction = (
    currentState, startTransaction, commitTransaction, logger?: Logger
) => {

    let transactionCommitted: boolean = false
    const checkIfCommitted = (): Result<string, null> =>
        transactionCommitted ? failure("Transaction already committed") : success(null)

    const nextState: InnerTripState = deepCopyInnerTripState(currentState)

    const tripTransaction: TripTransaction = {
        addEvent: (state) => checkIfCommitted().flatMap(_ => addEvent(nextState, state)),
        unsavedLocations: () => checkIfCommitted().map(_ => nextState.locations.filter(({id}) => id == null)),
        unsavedRoutes: () => checkIfCommitted().flatMap(_ => traverse(unsavedRoutes(nextState))),
        unsavedEvents: () => checkIfCommitted().map(_ => unsavedEvents(nextState)),
        rollback: () => checkIfCommitted().flatMap(todoFn("NO ROLLBACK")),
        commit: () => checkIfCommitted().flatMap(() => commitTransaction(nextState))
    };

    startTransaction(tripTransaction)

    return tripTransaction;
}

