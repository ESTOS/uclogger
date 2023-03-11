import { Format } from "logform";

/**
 * Error values, highest to lowest
 */
// Mapping to winston levels necessary! -> https://github.com/winstonjs/winston#logging-levels
export type LogLevels = "error" | "warn" | "info" | "debug";

export interface ILogFilterConfig {
	// The two filters depend on another
	// If you set includes the name must match -> default changes to DO NOT WRITE entry
	// If you set excludes the name is not allowd to match -> default changes to WRITE entry
	// If you set includes and excludes the classname is first filtered for includes and then for excludes
	includeClassNames?: string[];
	excludeClassNames?: string[];

	includeMethodNames?: string[];
	excludeMethodNames?: string[];

	includeMessages?: string[];
	excludeMessages?: string[];
}

export interface ILogFilterConfigs {
	// Name you may add in the filter to match it while debugging inside transform in elogger.js
	debugName?: string;
	// Use this filter if you want to log specific methods or classes no matter which loglevel has been raised
	common?: ILogFilterConfig | boolean;
	// Uses these filters if you want to log specific levels with different settings
	// e.g. if you want to log error and warn always, but debug only if a certain method is handling it
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

// Settings about the infrastructure
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

// These are the labels we use for loki. They are added for the log entries towards loki
export interface ILokiConfigLabels {
	// uniqe job name to filter in grafana e.g. "econf-server" | "econf-frontend"
	job: string;
	// Instance of the server that is writing the log entries - FQDN of the server e.g. "ecs-1.meetings.procall.de" | "meetings.procall.de"
	instance: string;
	// Environment this system is running in
	environment: "development" | "staging" | "production";
	// ! We won´t support other labels in here !
	// In case we need log message related labels we would add a callback here
	// This callback would then receive the log data and the callee could fetch additional labels from the log data and hand it back
}

// For Loki we can specify alternate labels for certain log entry calls
// In order to specify that those alternate labels shall be used the meta needs to contain the lokiLabelsKey key and the ILokiConfig the matching entry in the map
export interface ILokiAlternateLabelsMeta {
	lokiLabelsKey?: string;
}

// ILokiConfig
export interface ILokiConfig {
	// URL for Grafana Loki
	host: string;
	// Default labels we set for loki log entries
	labels: ILokiConfigLabels;
	// Alternative labels we use instead of the default labels above
	// If the meta data is using the type ILokiAlternateLabelsMeta and the lokiLabelsKey points to an entry in that map we use the labels from the map
	// If the alternateLabels or if a property in it is missing we use the default labels above (or just the missing property)
	alternateLabels: Map<string, ILokiConfigLabels> | undefined;
	// Basic Auth credentials is needed
	basicAuth?: string;
	// Caches logs to flush them later to loki at once
	useCache?: boolean;
	// Log level for loki
	level?: LogLevels;
}

// ELoggerSettings
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

// The log data blob whichn is provided through the ILogCallback
export interface ILogData {
	className: string;
	classProps?: {
		// This object will contain further application and implementation specific members like
		// session ids, user ids etc.
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

// The callback that is used to query log data for a log invoke
export interface ILogCallback {
	getLogData(): ILogData;
}

/**
 * Helper to access wether an error object has already been processed as error by the logger
 */
export interface ILoggerHandledError extends Error {
	// the logger sets the property to true once it has logged the error object
	// It allows to change the loglevel for subsequent calls from error to debug
	bHandled?: true;
}

// Config for the console logging
// Usage is pretty simple and uses regular expressions for matching

// If you do not specifify anything, everything is logged -> defaults to true for all of them
// If you:
// - do not want certain levels to be logged, specify false
// - only want certain levels to be logged, specify the regular expression matching classnames and or methodnames
//   if any of the conditions matches the entry will be logged

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
