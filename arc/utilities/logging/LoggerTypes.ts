export type Logger = {
    fatal: (message?: any, ...optionalParams: any[]) => void
    error: (message?: any, ...optionalParams: any[]) => void
    warn: (message?: any, ...optionalParams: any[]) => void
    info: (message?: any, ...optionalParams: any[]) => void
    debug: (message?: any, ...optionalParams: any[]) => void
    trace: (message?: any, ...optionalParams: any[]) => void
    createChild: (tag: string, childLevel?: LogLevel) => Logger
    setLevel: (level: LogLevel) => void
}

export type LogLevel = "FATAL" | "ERROR" | "WARN" | "INFO" | "DEBUG" | "TRACE"

