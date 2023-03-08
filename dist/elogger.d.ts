import { LeveledLogMethod, Logger } from "winston";
import { ILoggerHandledError, IELoggerSettings, IFileLog, IFinalLogData, ILogData, LogLevels, ILogCallback } from "./types";
import TransportStream from "winston-transport";
import { FileTransportOptions } from "winston/lib/winston/transports";
/**
 * Class handling different logic between usual logger
 */
declare class ELogger {
    test: boolean;
    console?: Console;
    logger?: Logger;
    logSettings?: IELoggerSettings;
    logSubsequentErrorsAs?: LogLevels | null;
    callback?: (context: IFinalLogData) => IFinalLogData;
    /**
     * Creates an instance of ELogger.
     *
     * @param test - true to run logger in test mode (console only). Default false
     */
    constructor(test?: boolean);
    /**
     * Sets a callback that is invoked just before handing over the logdata to the transport
     *
     * @param callback - the callack to invoke
     */
    setCallback(callback: (context: IFinalLogData) => IFinalLogData): void;
    /**
     * Interal log entry
     *
     * @param msg - log message to write
     * @param callingMethod - calling method of the log
     * @param logDataOrCallback - additional data or the log or callback which returns additional data
     * @param meta - context meta data
     * @param error - throws Error
     * @param level - log level
     * @param logMethod - log method
     */
    writeLog(msg: string, callingMethod: string, logDataOrCallback?: ILogCallback | ILogData, meta?: Record<string, unknown>, error?: unknown, level?: LogLevels, logMethod?: LeveledLogMethod | ((message?: unknown, ...optionalParams: any[]) => void)): void;
    /**
     * Logs a debug entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param logDataOrCallback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    debug(msg: string, callingMethod: string, logDataOrCallback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs an error into the logger. If the error is undefined creates an exception internally and pops off the call into the logger from the stack trace
     * The logger adds a bHandled to the error object which the caller handed over. Subsequent error calls with the same error object are afterwards logged
     * as debug message and longer as error. This simplifies error handling and logging over multiple layers in the software
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param logDataOrCallback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    error(msg: string, callingMethod: string, logDataOrCallback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown | Error | ILoggerHandledError): void;
    /**
     * Logs an info entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param logDataOrCallback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    info(msg: string, callingMethod: string, logDataOrCallback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs a warning entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param logDataOrCallback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    warn(msg: string, callingMethod: string, logDataOrCallback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Logs an error into the logger. If the error is undefined creates an exception internally and pops off the call into the logger from the stack trace
     * The logger adds a bHandled to the error object which the caller handed over. Subsequent error calls with the same error object are afterwards logged
     * as debug message and longer as error. This simplifies error handling and logging over multiple layers in the software
     *
     * @param level - Log level
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param logDataOrCallback - A callback to aquire log data from the caller or the logdata itself (e.g. className)
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    log(level: LogLevels, msg: string, callingMethod: string, logDataOrCallback?: ILogData | ILogCallback, meta?: Record<string, unknown>, error?: unknown): void;
    /**
     * Creates winstong file logger config
     *
     * @param options - File logger config
     * @param rootOptions - General logger config
     * @returns winsont file logger options
     */
    getWinstonFileLogOptions(options?: IFileLog | IFileLog, rootOptions?: IELoggerSettings): FileTransportOptions;
    /**
     * Returns own class properties to the logger
     *
     * @returns object with attribute className
     */
    getLogData(): {
        className: string;
    };
    /**
     * Initializes the logger
     *
     * @param logSettings - general logger settions
     * @param additionalTransports - list of existing winston transport instances
     */
    init(logSettings: IELoggerSettings, additionalTransports?: TransportStream[]): void;
    /**
     * Call exit to flush logs
     */
    exit(): Promise<void>;
    /**
     * Marks an error object as beeing handled by the logger
     *
     * @param error - error object to with bHandled attribute
     */
    setMarkErrorAsHandled(error: unknown | ILoggerHandledError): void;
    /**
     * Remvoes the beeing handled marker from an error object
     *
     * @param error - error object with bHandled attribute
     */
    removeMarkErrorAsHandled(error: Error & ILoggerHandledError): void;
}
export default ELogger;
//# sourceMappingURL=elogger.d.ts.map