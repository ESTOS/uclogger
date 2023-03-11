import { Format } from "logform";
/**
 * Error values, highest to lowest
 */
export type LogLevels = "error" | "warn" | "info" | "debug";
export interface ILogFilterConfig {
    includeClassNames?: string[];
    excludeClassNames?: string[];
    includeMethodNames?: string[];
    excludeMethodNames?: string[];
    includeMessages?: string[];
    excludeMessages?: string[];
}
export interface ILogFilterConfigs {
    debugName?: string;
    common?: ILogFilterConfig | boolean;
    debug?: ILogFilterConfig | boolean;
    error?: ILogFilterConfig | boolean;
    info?: ILogFilterConfig | boolean;
    warn?: ILogFilterConfig | boolean;
}
export interface IFileLog {
    /** Logging directory */
    logDirectory: string;
    /** Logfile name */
    logFilename: string;
    /** The logfile will be pretty printed (instead of one entry per line), defines the amount of spaces added per indentation */
    prettyPrintLogFile?: number;
    /** Maximum file size, defaults to 1048576 (1024*1024) */
    maxFileSize?: number;
    /** Maximum file count, defaults to 5 */
    maxFileCount?: number;
    /** Always use a new file */
    bNewFileAlways?: boolean;
    /** Loglevel this logwriter should print out. If no loglevel is specified the IELoggerSettings loglevel is used */
    logLevel?: LogLevels;
    /** Use this filter out certain properties and large objects from the log messages (e.g. websocket objects) */
    filterData?: Format;
    /** If this logfile should only contain certain messages use the filter configuration */
    filter?: ILogFilterConfigs;
    /** Enable sync logging. Only for local debug may break on production */
    bSyncLogging?: boolean;
}
interface IConsoleLog {
    logConsole: boolean;
    /** Instead of logging the formatted messages you can also set the console logger to log the json objects. This shows them in a tree mode in VSCode. */
    logObjectInsteadOfMessage?: boolean;
    /** Loglevel this logwriter should print out. If no loglevel is specified the IELoggerSettings loglevel is used */
    logLevel?: LogLevels;
    /** Use this filter out certain properties and large objects from the log messages (e.g. websocket objects) */
    filterData?: Format;
    /** If this logfile should only contain certain messages use the filter configuration */
    filter?: ILogFilterConfigs;
    /** True will make sure json is not prettyprinted is default false */
    multiline?: boolean;
}
export interface IEInfrastructureParameters {
    /** process.env.NODE_ENV */
    environment: string;
    /** process.env.SERVER_NAME */
    servername: string;
    /** process.env.NODE_ROLE */
    role: string;
    /** process.env.NODE_ROLE_INSTANCE || 0 */
    role_instance: number;
}
export interface ILokiConfigLabels {
    job: string;
    instance: string;
    environment: "development" | "staging" | "production";
}
export interface ILokiAlternateLabelsMeta {
    lokiLabelsKey?: string;
}
export interface ILokiConfig {
    host: string;
    labels: ILokiConfigLabels;
    alternateLabels: Map<string, ILokiConfigLabels> | undefined;
    basicAuth?: string;
    useCache?: boolean;
    level?: LogLevels;
}
export interface IELoggerSettings {
    /** A file logger or a list  of file loggers (each may specifiy which content it should write using the filter object */
    fileLog?: IFileLog | IFileLog[];
    /** Logging to console */
    consoleLog?: IConsoleLog;
    /**
     * NPM Logging levels https://github.com/winstonjs/winston#logging-levels
     * You may specify a different loglevel in the different log writers
     */
    logLevel: LogLevels;
    /** Infrastructure parameters (see above) */
    infrastructure: IEInfrastructureParameters;
    /** Logging to Loki */
    lokiLog?: ILokiConfig;
    /**
     * Configures the logger to log errors only once and subsequent calls with the specified loglevel
     * Default is error so subsequent calls with the same error object are normally logged
     * Set it to e.g. debug if subsequent calls shall get logged as debug message
     * or null if subsequent calls should not get logged at all
     */
    logSubsequentErrorsAs?: LogLevels | null;
    syncLogPath?: string;
}
export interface ILogData {
    className: string;
    classProps?: {
        [propName: string]: unknown;
    };
}
export interface IFinalLogData extends ILogData {
    time: string;
    level: LogLevels;
    message: string;
    method: string;
    meta?: unknown | ILokiAlternateLabelsMeta;
    cause?: unknown | string;
    lokiLabelsKey?: string;
}
export interface ILogCallback {
    getLogData(): ILogData;
}
/**
 * Helper to access wether an error object has already been processed as error by the logger
 */
export interface ILoggerHandledError extends Error {
    bHandled?: true;
}
/**
 * Interface to a logger implementing class / object
 */
export interface ILogger {
    /**
     * Logs an error into the logger. If the error is undefined creates an exception internally and pops off the call into the logger from the stack trace
     * The logger adds a bHandled to the error object which the caller handed over. Subsequent error calls with the same error object are afterwards logged
     * as debug message and longer as error. This simplifies error handling and logging over multiple layers in the software
     *
     * @param msg - The message to log
     * @param calling_method - The method that was calling the logger
     * @param logData_or_Callback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    error(msg: string, calling_method: string, logData_or_Callback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs a warning entry into the logger
     *
     * @param msg - The message to log
     * @param calling_method - The method that was calling the logger
     * @param logData_or_Callback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    warn(msg: string, calling_method: string, logData_or_Callback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs an info entry into the logger
     *
     * @param msg - The message to log
     * @param calling_method - The method that was calling the logger
     * @param logData_or_Callback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    info(msg: string, calling_method: string, logData_or_Callback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs a debug entry into the logger
     *
     * @param msg - The message to log
     * @param calling_method - The method that was calling the logger
     * @param logData_or_Callback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    debug(msg: string, calling_method: string, logData_or_Callback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
}
export {};
//# sourceMappingURL=types.d.ts.map