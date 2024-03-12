import {AppEntry} from "./AppEntry";
import React from "react";
import {buildAsyncStorageNavigationStateRepository} from "./navigation/AsyncStorageNavigationStateRepository";

export const DeviceAppEntry: React.FC = () => {

    const navigationStateRepository = buildAsyncStorageNavigationStateRepository();

    return <AppEntry navigationStateRepository={navigationStateRepository}/>
}
