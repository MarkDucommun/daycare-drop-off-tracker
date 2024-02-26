import React, {createContext, ReactNode, useState} from "react";
import {TripRepository} from "../../tripTypes";
import {fakeTripRepository} from "./fakeTripRepository";

const defaultValue = fakeTripRepository;
export const TripRepositoryContext = createContext<TripRepository>(defaultValue)

type TripRepositoryProviderProps = {
    children?: ReactNode
    injectedRepository?: TripRepository
}

export const TripRepositoryProvider: React.FC<TripRepositoryProviderProps> = ({children, injectedRepository}) => {

    const [logger, setLogger] = useState<TripRepository>(injectedRepository || defaultValue)

    return <TripRepositoryContext.Provider value={logger}>
        {children}
    </TripRepositoryContext.Provider>
}