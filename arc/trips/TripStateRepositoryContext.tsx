import React, {createContext, ReactNode, useState} from "react";
import {TripStateRepository} from "./TripStateRepositoryType";

export const TripStateRepositoryContext = createContext<TripStateRepository>({} as unknown as TripStateRepository)

type TripStateRepositoryProviderProps = {
    children?: ReactNode
    injectedRepository: TripStateRepository
}

export const TripStateRepositoryProvider: React.FC<TripStateRepositoryProviderProps> = ({children, injectedRepository}) => {

    const [tripStateRepository, setLogger] = useState<TripStateRepository>(injectedRepository)

    return <TripStateRepositoryContext.Provider value={tripStateRepository}>{children}</TripStateRepositoryContext.Provider>
}
