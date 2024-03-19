import React, {createContext, ReactNode, useState} from "react";
import {AlertManager, defaultAlertManager} from "./AlertManager";


export const AlertManagerContext = createContext<AlertManager>(defaultAlertManager)

type AlertManagerProviderProps = {
    children?: ReactNode
    injectedAlertManager?: AlertManager | undefined
}

export const AlertManagerProvider: React.FC<AlertManagerProviderProps> =
    ({children, injectedAlertManager}) => {

        const [alertManager] = useState<AlertManager>(injectedAlertManager || defaultAlertManager)

        return <AlertManagerContext.Provider value={alertManager}>{children}</AlertManagerContext.Provider>
    }
