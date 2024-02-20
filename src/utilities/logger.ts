import {doOnSuccess, Result, successIfTruthy} from "./results";

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

type CreateLogger = (tag: string, initialLevel?: LogLevel, color?: keyof Colors) => Logger

type Colors = {
    yellow: "\x1b[93m"
    lightBlueColor: "\x1b[94m"
    orange: "\x1b[91m"
    green: "\x1b[32m"
    red: "\x1b[31m"
    purple: "\x1b[95m"
}

const colors: Colors = {
    yellow: "\x1b[93m",
    lightBlueColor: "\x1b[94m",
    orange: "\x1b[91m",
    green: "\x1b[32m",
    red: "\x1b[31m",
    purple: "\x1b[95m"
}

export const createLogger: CreateLogger = (tag, initialLevel = "INFO", color: keyof Colors = "lightBlueColor"): Logger => {
    let level: LogLevel = initialLevel
    const children: Logger[] = []

    const resetColor = "\x1b[0m";
    const prefixColor = colors[color]

    const prefix = `${prefixColor}[${tag}]${resetColor}:`

    const compareAndLog = createLeveledLogger(() => level, prefix)

    return {
        createChild: (childTag, childLevel: LogLevel = level) => {
            const childLogger = createLogger(`${tag}:${childTag}`, childLevel);
            children.push(childLogger);
            return childLogger;
        },
        setLevel: (nextLevel: LogLevel): void => {
            level = nextLevel
            children.forEach((child) => child.setLevel(nextLevel))
        },
        fatal: compareAndLog("FATAL", console.error),
        error: compareAndLog("ERROR", console.error),
        warn: compareAndLog("WARN", console.warn),
        info: compareAndLog("INFO", console.info),
        debug: compareAndLog("DEBUG", console.debug),
        trace: compareAndLog("TRACE", console.trace),
    }
}

const compareLevel = (currentLevel: LogLevel, statementLevel: LogLevel): Result<string, boolean> => {
    const levels: LogLevel[] = ["FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"]
    return successIfTruthy(levels.indexOf(currentLevel) >= levels.indexOf(statementLevel))
}

const createLeveledLogger = (getLevel: () => LogLevel, prefix: string) => (statementLevel: LogLevel, log: (message?: any, ...optionalParams: any[]) => void) =>
    (message?: string, ...optionalParams: any[]): void => {
        compareLevel(getLevel(), statementLevel)
            .doOnSuccess(() => {
                if (typeof message == 'string' && optionalParams.length > 0)
                    log(`${prefix} ${message}`, optionalParams)
                else if (typeof message == 'string') log(`${prefix} ${message}`)
                else if (optionalParams.length > 0) {
                    log(prefix)
                    log(message, optionalParams)
                } else {
                    log(prefix)
                    log(message)
                }
            })
    }
