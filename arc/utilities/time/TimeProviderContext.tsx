import React, {createContext, ReactNode, useState} from "react";
import {createTimeProvider, TimeProvider} from "./TimeProvider";

const defaultTimeProvider = createTimeProvider();

export const TimeProviderContext = createContext<TimeProvider>(defaultTimeProvider)

type TripStateRepositoryProviderProps = {
    children?: ReactNode
    injectedProvider?: TimeProvider
}

export const TimeProviderProvider: React.FC<TripStateRepositoryProviderProps> = ({children, injectedProvider}) => {

    const [timeProvider, setLogger] = useState<TimeProvider>(injectedProvider || defaultTimeProvider)

    return <TimeProviderContext.Provider value={timeProvider}>{children}</TimeProviderContext.Provider>
}
