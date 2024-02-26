import {createLogger, Logger} from "./utilities/logger";
import React, {createContext, ReactNode, useState} from "react";

const defaultLogger = createLogger('app');
export const LoggerContext = createContext<Logger>(defaultLogger);

type LoggerProviderProps = {
    children?: ReactNode
    injectedLogger?: Logger
}
export const LoggerProvider: React.FC<LoggerProviderProps> = ({children, injectedLogger}) => {

    const [logger, setLogger] = useState<Logger>(injectedLogger || defaultLogger)

    return <LoggerContext.Provider value={logger}>
        {children}
    </LoggerContext.Provider>
}
