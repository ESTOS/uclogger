"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const winston_1 = __importDefault(require("winston"));
const lokiWinstonTransport_1 = __importDefault(require("./lokiWinstonTransport"));
const syncFileWriterWinstonTransport_1 = __importDefault(require("./syncFileWriterWinstonTransport"));
/**
 * Filters message that are written to the console according to the parameters as specified while initializing the console logger (IConsoleFilterConfigs)
 */
class LogFilter {
    /**
     * Creates a logfilter
     *
     * @param opts - Log filter options
     */
    constructor(opts) {
        /**
         * Transforms a log entry with the given filters
         *
         * @param info - final log entry
         * @param opts - logconfigs to apply
         * @returns processed log data
         */
        this.transform = (info, opts) => {
            if (opts == null)
                return info;
            if (opts.common) {
                if (!this.checkFilter(info, opts.common))
                    return false;
            }
            if (info.level === "debug") {
                if (!this.checkFilter(info, opts.debug))
                    return false;
            }
            else if (info.level === "error") {
                if (!this.checkFilter(info, opts.error))
                    return false;
            }
            else if (info.level === "info") {
                if (!this.checkFilter(info, opts.info))
                    return false;
            }
            else if (info.level === "warn") {
                if (!this.checkFilter(info, opts.warn))
                    return false;
            }
            return info;
        };
        this.options = opts;
    }
    /**
     * Filters logs against the configured filter options
     *
     * @param msg - Log message to filter
     * @param filter - True/False enabled filter
     * @returns true if message has to be filtered, false if not
     */
    checkFilter(msg, filter) {
        if (filter === undefined || filter === true)
            return true;
        if (filter === false)
            return false;
        // define result as undefined
        let bAllow;
        if (filter.includeClassNames || filter.includeMethodNames || filter.includeMessages) {
            // If any include is configured, set allow to false
            // any match will set allow to true
            bAllow = false;
            /* istanbul ignore else */
            if (filter.includeClassNames && msg.className && msg.className.match) {
                for (const classname of filter.includeClassNames) {
                    if (msg.className.match(classname)) {
                        bAllow = true;
                        break;
                    }
                }
            }
            /* istanbul ignore else */
            if (!bAllow && filter.includeMethodNames && msg.method && msg.method.match) {
                for (const methodname of filter.includeMethodNames) {
                    if (msg.method.match(methodname)) {
                        bAllow = true;
                        break;
                    }
                }
            }
            /* istanbul ignore else */
            if (!bAllow && filter.includeMessages && msg.message && msg.message.match) {
                for (const message of filter.includeMessages) {
                    if (msg.message.match(message)) {
                        bAllow = true;
                        break;
                    }
                }
            }
            // if no include was set the allow is false and we return here
            if (bAllow === false)
                return false;
        }
        // If include was set or it was left undefined check the excludes
        bAllow = true;
        /* istanbul ignore else */
        if (filter.excludeClassNames || filter.excludeMethodNames || filter.excludeMessages) {
            // Id one of the excludes matches we set the log to false
            /* istanbul ignore else */
            if (filter.excludeClassNames && msg.className) {
                for (const classname of filter.excludeClassNames) {
                    if (msg.className.match(classname)) {
                        bAllow = false;
                        break;
                    }
                }
            }
            /* istanbul ignore else */
            if (bAllow && filter.excludeMethodNames && msg.method) {
                for (const methodname of filter.excludeMethodNames) {
                    if (msg.method.match(methodname)) {
                        bAllow = false;
                        break;
                    }
                }
            }
            /* istanbul ignore else */
            if (bAllow && filter.excludeMessages && msg.message) {
                for (const message of filter.excludeMessages) {
                    if (msg.message.match(message)) {
                        bAllow = false;
                        break;
                    }
                }
            }
        }
        return bAllow;
    }
}
/**
 * Simple wrapper that filters lokiLabelLogs for the file transport
 */
class SimpleFileTransport extends winston_1.default.transports.File {
    /**
     * Hook log callback
     *
     * @param info - LogEntry
     * @param callback - Callback to winston main file logger
     */
    log(info, callback) {
        if (super.log)
            super.log(info, callback);
    }
}
/**
 */
class SimpleConsoleTransport extends winston_1.default.transports.Console {
    /**
     * Initialises custom console tranpoert wrapper
     *
     * @param options - Transport config
     */
    constructor(options) {
        super(options);
        this.test = false;
        this.logObjectInsteadOfMessage = false;
        this.multiline = false;
        /* istanbul ignore next */
        this.logObjectInsteadOfMessage = options.logObjectInsteadOfMessage ? true : false;
        this.multiline = options.multiline ? true : false;
        this.test = options.test ? true : false;
        if ("test" in options && options["test"])
            this.console = undefined;
        else
            this.console = console;
    }
    /**
     * Hook to log console
     *
     * @param info - Single log entry
     * @param callback - winston process callback
     */
    log(info, callback) {
        let logData;
        try {
            if (this.logObjectInsteadOfMessage && this.multiline)
                logData = JSON.stringify(info, null, 2);
            else if (this.logObjectInsteadOfMessage && !this.multiline)
                logData = JSON.stringify(info);
            else
                logData = JSON.stringify(info["message"], null, 2);
            // the logger does not log beyond nesting level 2 and adds elements with [Object] to the output instead
            // As we like to have the full output we need to prettyprint in advance
        }
        catch (error) {
            logData = JSON.stringify(error, null, 2);
        }
        if (this.console) {
            if (info.level === "debug")
                this.console.debug(logData);
            else if (info.level === "error")
                this.console.error(logData);
            else if (info.level === "warn")
                this.console.warn(logData);
            else
                this.console.info(logData);
        }
        /* istanbul ignore else */
        if (callback)
            callback();
    }
}
/**
 * Class handling different logic between usual logger
 */
class ELogger {
    /**
     * Creates an instance of ELogger.
     *
     * @param test - true to run logger in test mode (console only). Default false
     */
    constructor(test) {
        this.test = false;
        this.callback = undefined;
        this.test = (test != null && !test) ? true : false;
        /* istanbul ignore next */
        if (!test)
            this.console = console;
        this.logger = undefined;
        this.logSettings = undefined;
        this.logSubsequentErrorsAs = undefined;
    }
    /**
     * Sets a callback that is invoked just before handing over the logdata to the transport
     *
     * @param callback - the callack to invoke
     */
    setCallback(callback) {
        this.callback = callback;
    }
    /**
     * Interal log entry
     *
     * @param msg - log message to write
     * @param callingMethod - calling method of the log
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - context meta data
     * @param error - throws Error
     * @param level - log level
     * @param logMethod - log method
     */
    writeLog(msg, callingMethod, context, meta, error, level, logMethod) {
        var _a, _b, _c, _d, _e, _f;
        try {
            let finalLogData = {
                time: new Date().toISOString(),
                level: level || "info",
                message: msg,
                method: callingMethod,
                className: "ELogger"
            };
            if (context) {
                if ("getLogData" in context && typeof context.getLogData === "function") {
                    try {
                        const logData = context.getLogData();
                        finalLogData.className = logData.className;
                        finalLogData.classProps = logData.classProps;
                    }
                    catch (error) {
                        (_a = this.console) === null || _a === void 0 ? void 0 : _a.error("getLogData() raised an exception", error);
                    }
                }
                else {
                    if ("className" in context)
                        finalLogData.className = context.className;
                    else
                        finalLogData.className = (_b = context.constructor) === null || _b === void 0 ? void 0 : _b.name;
                    if ("classProps" in context)
                        finalLogData.classProps = context.classProps;
                }
            }
            if (!msg)
                (_c = this.console) === null || _c === void 0 ? void 0 : _c.error(`You MUST specify a log message ${finalLogData.className}.${finalLogData.method}`);
            if (error) {
                try {
                    finalLogData.cause = error;
                }
                catch (error) {
                    /* istanbul ignore next */
                    (_d = this.logger) === null || _d === void 0 ? void 0 : _d.error("Could not log exception from error");
                }
            }
            if (meta) {
                if ("lokiLabelsKey" in meta) {
                    finalLogData.lokiLabelsKey = meta.lokiLabelsKey;
                    delete meta["lokiLabelsKey"];
                }
                finalLogData.meta = meta;
            }
            /* istanbul ignore else */
            if (this.callback)
                finalLogData = this.callback(finalLogData);
            if (logMethod)
                logMethod(finalLogData);
        }
        catch (error) {
            /* istanbul ignore next */
            try {
                let log = "Unhandled exception inside elogger:";
                log += ` level:'${level}'`;
                log += ` log:'${msg}'`;
                log += ` callingMethod:'${callingMethod}'`;
                /* istanbul ignore next */
                log += ` context:'${context ? "provided" : "not provided"}'`;
                /* istanbul ignore next */
                log += ` meta:'${meta ? "provided" : "not provided"}'`;
                /* istanbul ignore next */
                log += ` exception:'${error ? "provided" : "not provided"}'`;
                log += ` error:'${error}'`;
                (_e = this.console) === null || _e === void 0 ? void 0 : _e.error(log);
            }
            catch (error) {
                /* istanbul ignore next */
                (_f = this.console) === null || _f === void 0 ? void 0 : _f.error("FATAL exception inside elogger:", error);
            }
        }
    }
    /**
     * Logs a debug entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    debug(msg, callingMethod, context, meta, error) {
        var _a;
        this.writeLog(msg, callingMethod, context, meta, error, "debug", this.logger ? this.logger.debug : (_a = this.console) === null || _a === void 0 ? void 0 : _a.debug);
    }
    /**
     * Logs an error into the logger. If the error is undefined creates an exception internally and pops off the call into the logger from the stack trace
     * The logger adds a bHandled to the error object which the caller handed over. Subsequent error calls with the same error object are afterwards logged
     * as debug message and longer as error. This simplifies error handling and logging over multiple layers in the software
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    error(msg, callingMethod, context, meta, error) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        if (error == null) {
            error = new Error(msg);
            if (error instanceof Error && "stack" in error && error.stack != null) {
                const pos1 = error.stack.indexOf("\n");
                /* istanbul ignore else */
                if (pos1 && pos1 > 0) {
                    const pos2 = (_a = error.stack) === null || _a === void 0 ? void 0 : _a.indexOf("\n", pos1 + 1);
                    /* istanbul ignore else */
                    if (pos2 && pos2 > 0)
                        error.stack = ((_b = error.stack) === null || _b === void 0 ? void 0 : _b.substring(0, pos1)) + ((_c = error.stack) === null || _c === void 0 ? void 0 : _c.substring(pos2));
                }
            }
        }
        if (error instanceof Error)
            error = Object.assign({}, { stack: error.stack, message: error.message, name: error.name });
        else if (typeof error === "object" && error !== null)
            error = Object.assign({}, error);
        // The marker whether this error has already been logged
        let bHandled = false;
        if (this.logSubsequentErrorsAs) {
            // If logger calls are logged differently whether they have already been logged we need to check if the error is already flagged as beeing logged
            try {
                const castBHandled = error.bHandled;
                bHandled = castBHandled != null && castBHandled ? true : false;
            }
            catch (error) {
                bHandled = false;
            }
        }
        if (!bHandled) {
            // The error has not yet been logged -> log it now with severity error
            this.writeLog(msg, callingMethod, context, meta, error, "error", this.logger ? this.logger.error : (_d = this.console) === null || _d === void 0 ? void 0 : _d.error);
            if (this.logSubsequentErrorsAs) {
                // Mark this error as beeing handled. Subsequent calls are afterwards logged with a different (logSubsequentErrorsAs) log level
                error.bHandled = true;
            }
        }
        else {
            if (((_e = this.logSettings) === null || _e === void 0 ? void 0 : _e.logSubsequentErrorsAs) === "info")
                this.writeLog(msg, callingMethod, context, meta, error, "info", this.logger ? this.logger.info : (_f = this.console) === null || _f === void 0 ? void 0 : _f.info);
            else if (this.logSubsequentErrorsAs === "warn")
                this.writeLog(msg, callingMethod, context, meta, error, "warn", this.logger ? this.logger.warn : (_g = this.console) === null || _g === void 0 ? void 0 : _g.warn);
            else if (this.logSubsequentErrorsAs === "debug")
                this.writeLog(msg, callingMethod, context, meta, error, "debug", this.logger ? this.logger.debug : (_h = this.console) === null || _h === void 0 ? void 0 : _h.debug);
            else
                this.writeLog(msg, callingMethod, context, meta, error, "error", this.logger ? this.logger.error : (_j = this.console) === null || _j === void 0 ? void 0 : _j.error);
        }
    }
    /**
     * Logs an info entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    info(msg, callingMethod, context, meta, error) {
        var _a;
        this.writeLog(msg, callingMethod, context, meta, error, "info", this.logger ? this.logger.info : (_a = this.console) === null || _a === void 0 ? void 0 : _a.info);
    }
    /**
     * Logs a warning entry into the logger
     *
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    warn(msg, callingMethod, context, meta, error) {
        var _a;
        this.writeLog(msg, callingMethod, context, meta, error, "warn", this.logger ? this.logger.warn : (_a = this.console) === null || _a === void 0 ? void 0 : _a.warn);
    }
    /**
     * Logs an error into the logger. If the error is undefined creates an exception internally and pops off the call into the logger from the stack trace
     * The logger adds a bHandled to the error object which the caller handed over. Subsequent error calls with the same error object are afterwards logged
     * as debug message and longer as error. This simplifies error handling and logging over multiple layers in the software
     *
     * @param level - Log level
     * @param msg - The message to log
     * @param callingMethod - The method that was calling the logger
     * @param context - provides contextual data as callback, dedicated data as ILogData or just the classname calling the logger
     * @param meta - Meta data the caller wants to add to the log request
     * @param error - Any kind of error message.
     */
    log(level, msg, callingMethod, context, meta, error) {
        var _a, _b, _c, _d;
        let method = this.logger ? this.logger.debug : (_a = this.console) === null || _a === void 0 ? void 0 : _a.debug;
        if (level === "warn")
            method = this.logger ? this.logger.warn : (_b = this.console) === null || _b === void 0 ? void 0 : _b.warn;
        else if (level === "info")
            method = this.logger ? this.logger.info : (_c = this.console) === null || _c === void 0 ? void 0 : _c.info;
        else if (level === "error")
            method = this.logger ? this.logger.error : (_d = this.console) === null || _d === void 0 ? void 0 : _d.error;
        this.writeLog(msg, callingMethod, context, meta, error, level, method);
    }
    /**
     * Creates winstong file logger config
     *
     * @param options - File logger config
     * @param rootOptions - General logger config
     * @returns winsont file logger options
     */
    getWinstonFileLogOptions(options, rootOptions) {
        const formats = [];
        /* istanbul ignore else */
        if (options) {
            if (options.filter)
                formats.push(new LogFilter(options.filter));
            if (options.filterData)
                formats.push(options.filterData);
            if (options.prettyPrintLogFile)
                formats.push(winston_1.default.format.json({ space: options.prettyPrintLogFile }));
        }
        const format = winston_1.default.format.combine(...formats);
        const winstonOptions = {
            format
        };
        if (options) {
            if (options.logDirectory)
                winstonOptions.filename = path_1.default.join(options.logDirectory, options.logFilename);
            if (options.maxFileSize)
                winstonOptions.maxsize = options.maxFileSize ? options.maxFileSize : 1048576;
            if (options.maxFileCount)
                winstonOptions.maxFiles = options.maxFileCount ? options.maxFileCount : 5;
            if (options.logLevel || (rootOptions === null || rootOptions === void 0 ? void 0 : rootOptions.logLevel))
                winstonOptions.level = options.logLevel ? options.logLevel : rootOptions === null || rootOptions === void 0 ? void 0 : rootOptions.logLevel;
            if (options.bNewFileAlways)
                winstonOptions.options = options.bNewFileAlways ? { flags: "w" } : undefined;
        }
        return winstonOptions;
    }
    /**
     * Returns own class properties to the logger
     *
     * @returns object with attribute className
     */
    getLogData() {
        return {
            className: "ELogger"
        };
    }
    /**
     * Initializes the logger
     *
     * @param logSettings - general logger settions
     * @param additionalTransports - list of existing winston transport instances
     */
    init(logSettings, additionalTransports) {
        this.logSettings = logSettings;
        this.logSubsequentErrorsAs = logSettings.logSubsequentErrorsAs;
        const loggerTransports = additionalTransports || [];
        /* istanbul ignore else */
        if (logSettings.fileLog) {
            if (!Array.isArray(logSettings.fileLog)) {
                if (logSettings.fileLog.bSyncLogging) {
                    const options = this.getWinstonFileLogOptions(logSettings.fileLog, logSettings);
                    const syncFileWriter = new syncFileWriterWinstonTransport_1.default(options, logSettings.fileLog.prettyPrintLogFile);
                    loggerTransports.push(syncFileWriter);
                }
                else {
                    const options = this.getWinstonFileLogOptions(logSettings.fileLog, logSettings);
                    const fileTransport = new SimpleFileTransport(options);
                    loggerTransports.push(fileTransport);
                }
            }
            else {
                for (const settings of logSettings.fileLog) {
                    if (settings.bSyncLogging) {
                        const options = this.getWinstonFileLogOptions(settings, logSettings);
                        const syncFileWriter = new syncFileWriterWinstonTransport_1.default(options, settings.prettyPrintLogFile);
                        loggerTransports.push(syncFileWriter);
                    }
                    else {
                        const options = this.getWinstonFileLogOptions(settings, logSettings);
                        const fileTransport = new SimpleFileTransport(options);
                        loggerTransports.push(fileTransport);
                    }
                }
            }
        }
        /* istanbul ignore else */
        if (logSettings.lokiLog) {
            const options = {
                host: logSettings.lokiLog.host,
                labels: logSettings.lokiLog.labels,
                alternateLabels: logSettings.lokiLog.alternateLabels,
                basicAuth: logSettings.lokiLog.basicAuth,
                useCache: logSettings.lokiLog.useCache
            };
            if (logSettings.lokiLog && logSettings.lokiLog.level)
                options.level = logSettings.lokiLog.level;
            else if (logSettings.logLevel)
                options.level = logSettings.logLevel;
            const lokiTransport = new lokiWinstonTransport_1.default(options);
            loggerTransports.push(lokiTransport);
        }
        /* istanbul ignore else */
        if (logSettings.consoleLog && logSettings.consoleLog.logConsole) {
            const formats = [];
            /* istanbul ignore else */
            if (logSettings.consoleLog.filter)
                formats.push(new LogFilter(logSettings.consoleLog.filter));
            /* istanbul ignore else */
            if (logSettings.consoleLog.filterData)
                formats.push(logSettings.consoleLog.filterData);
            /* istanbul ignore else */
            if (logSettings.consoleLog.filter)
                formats.push(winston_1.default.format.prettyPrint({ depth: 2 }));
            const format = winston_1.default.format.combine(...formats);
            const options = {
                // If you want to see the log object in the vscode console window, this property must be set true, otherwise you see the formatted message
                logObjectInsteadOfMessage: logSettings.consoleLog.logObjectInsteadOfMessage,
                level: logSettings.consoleLog.logLevel ? logSettings.consoleLog.logLevel : logSettings.logLevel,
                multiline: logSettings.consoleLog.multiline,
                format,
                test: this.test
            };
            const transportConsole = new SimpleConsoleTransport(options);
            loggerTransports.push(transportConsole);
        }
        this.logger = winston_1.default.createLogger({
            transports: loggerTransports,
            exitOnError: false // do not exit on handled exceptions
        });
        this.debug(`Logging started with loglevel: ${logSettings.logLevel}`, `init`, this.getLogData());
    }
    /**
     * Call exit to flush logs
     */
    exit() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => {
                var _a, _b;
                if (!this.logger)
                    resolve();
                (_a = this.logger) === null || _a === void 0 ? void 0 : _a.on("finish", () => {
                    setTimeout(() => { resolve(); }, 1000);
                });
                (_b = this.logger) === null || _b === void 0 ? void 0 : _b.end();
            });
        });
    }
    /**
     * Marks an error object as beeing handled by the logger
     *
     * @param error - error object to with bHandled attribute
     */
    setMarkErrorAsHandled(error) {
        error.bHandled = true;
    }
    /**
     * Remvoes the beeing handled marker from an error object
     *
     * @param error - error object with bHandled attribute
     */
    removeMarkErrorAsHandled(error) {
        delete error.bHandled;
    }
}
exports.default = ELogger;
//# sourceMappingURL=elogger.js.map