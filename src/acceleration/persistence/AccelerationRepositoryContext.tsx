import React, {createContext, ReactNode, useState} from "react";
import {AccelerationRepository} from "./AccelerationRepository";

const defaultRepository = {} as unknown as AccelerationRepository; // TODO be better
export const AccelerationRepositoryContext = createContext<AccelerationRepository>(defaultRepository)

type AccelerationRepositoryProviderProps = {
    children?: ReactNode
    injectedRepository?: AccelerationRepository
}

export const AccelerationRepositoryProvider: React.FC<AccelerationRepositoryProviderProps> = ({children, injectedRepository}) => {

    const [logger, setLogger] = useState<AccelerationRepository>(injectedRepository || defaultRepository)

    return <AccelerationRepositoryContext.Provider value={logger}>
        {children}
    </AccelerationRepositoryContext.Provider>
}
