export type ActionConfirmationCreator = (
    title: string,
    confirm: ActionButton,
    cancel: ActionButton,
    message?: string,
) => () => void

export type ActionButton = {
    text: string,
    onPress: () => void,
    style?: 'default' | 'cancel' | 'destructive' | undefined
}

export type AlertManager = {
    createConfirmation: ActionConfirmationCreator
}

export const defaultAlertManager: AlertManager = {
    createConfirmation: (title, confirm, cancel, message) => {
        return () => confirm.onPress()
    }
}
