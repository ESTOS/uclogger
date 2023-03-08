/* eslint-disable @typescript-eslint/no-var-requires */

import ELogger from "../src/elogger";
import { IFinalLogData, ILokiAlternateLabelsMeta, ILokiConfigLabels } from "../src/types";

const jestCallback = jest.fn((context: IFinalLogData) => context);

const eLoggerUninitialized = new ELogger(true);
eLoggerUninitialized.setCallback(jestCallback);

const eLogger = new ELogger(true);
eLogger.setCallback(jestCallback);

const lokiLabelKey = "jest_test_loki_label";
const logData = {
    className: "test",
    classProps: {
        prop1: "1",
        prop2: 2
    }
};

const logDataExclude = {
    className: "test_exc",
    classProps: {
        prop1: "1",
        prop2: 2
    }
};

const regularLogObject = {
    ...logData,
    message: "message",
    method: "callingMethod",
};

const errortoJSONException = {
    toJSON: () => {
        throw new Error("errortoJSONException");
    }
};

/**
 * Test callback for the log Callback
 */
const logCallBack = {
    getLogData: () => {
        return logData;
    }
};

/**
 * Test callback for the log Callback that throws an exception
 */
const logCallBackException = {
    getLogData: () => {
        throw new Error("logCallBackException");
    }
};

const TEMP_DIR = process.env["TMP"] || process.env["TMPDIR"] || process.env["TEMP"] || "./";

eLogger.init({
    logLevel: "debug",
    lokiLog: {
        host: "https://log.meetings.procall.de:3200/loki/api/v1/push",
        labels: { job: "test", environment: "development", instance: "localhost" },
        basicAuth: "meetings:RLxKTobhKd6SUYYeoUDs",
        alternateLabels: undefined
    },
    consoleLog: {
        logConsole: true,
        logObjectInsteadOfMessage: true,
        filter: {
            error: true,
            warn: true,
            info: {
                excludeClassNames: ["test_exc"],
                excludeMethodNames: ["callingMethod_exc"],
                excludeMessages: ["message_exc"]
            },
            debug: {
                includeClassNames: ["test"],
                includeMethodNames: ["callingMethod"],
                includeMessages: ["message"]
            }
        }
    },
    fileLog: {
        logFilename: "uccommonJestTest.log",
        logDirectory: TEMP_DIR,
        prettyPrintLogFile: 2,
        maxFileSize: 1024 * 1024 * 25,
        maxFileCount: 1,
        bNewFileAlways: true,
        logLevel: "debug"
    },
    infrastructure: {
        environment: "test",
        role: "execute_test",
        role_instance: 0,
        servername: "test.estos.de"
    }
});

// describe("Test ELogger", () => {

// afterAll(async () => {
// });

describe("Test elogger", () => {
    afterAll(async () => {
        await new Promise<void>(resolve => setTimeout(() => resolve(), 500)); // avoid jest open handle error
        eLogger.exit();
        await eLoggerUninitialized.exit();
    });

    it("info", async () => {
        jestCallback.mockClear();
        eLoggerUninitialized.info("message", "callingMethod", logCallBack, { meta: "data" });
        const expectResult = {
            ...regularLogObject,
            meta: {
                meta: "data"
            },
            level: "info",

        };
        const logResult = jestCallback.mock.results[0]?.value;
        expect(logResult.time).not.toBeUndefined()
        delete logResult["time"]
        expect(logResult).toEqual(expectResult);
    });

    it("debug", async () => {
        jestCallback.mockClear();
        eLoggerUninitialized.debug("message", "callingMethod", logCallBack, { meta: "data" });
        const expectResult = {
            ...regularLogObject,
            level: "debug",
            meta: {
                meta: "data"
            },
        };
        const logResult = jestCallback.mock.results[0]?.value;
        expect(logResult.time).not.toBeUndefined()
        delete logResult["time"]
        expect(logResult).toEqual(expectResult);
    });

    it("error", async () => {
        jestCallback.mockClear();
        const error = new Error("Test error");
        eLoggerUninitialized.error("message", "callingMethod", logCallBack, { meta: "data" }, error);
        const logResult = jestCallback.mock.results[0]?.value;

        expect(logResult.time).not.toBeUndefined();
        delete logResult["time"]

        expect(logResult.cause).not.toBeUndefined();
        expect(logResult.cause.message).toBe("Test error");
        delete logResult["cause"]

        const expectResult = {
            ...regularLogObject,
            meta: {
                meta: "data"
            },
            level: "error",
        };
        expect(logResult).toEqual(expectResult);
    });

    it("warn", async () => {
        jestCallback.mockClear();
        const error = new Error("Test error");
        eLoggerUninitialized.warn("message", "callingMethod", logCallBack, { meta: "data" });
        const logResult = jestCallback.mock.results[0]?.value;

        expect(logResult.time).not.toBeUndefined();
        delete logResult["time"]

        const expectResult = {
            ...regularLogObject,
            meta: {
                meta: "data"
            },
            level: "warn",
        };
        expect(logResult).toEqual(expectResult);
    });
});

describe("methods", () => {
    it("error", async () => {
        eLogger.error("message", "callingMethod", logCallBack, { meta: "error" }, new Error());
        eLogger.error("message", "callingMethod", logCallBack, { meta: "error" });
        eLogger.log("error", "message_exc", "callingMethod", logCallBack, { meta: "error" });
    });
    it("warn", async () => {
        eLogger.warn("message", "callingMethod_exc", logCallBack, { meta: "data" }, new Error());
        eLogger.log("warn", "message", "callingMethod_exc", logCallBack, { meta: "warn" });
    });
    it("info", async () => {
        eLogger.info("message", "callingMethod", logDataExclude, { meta: "data" }, new Error());
        eLogger.log("info", "message", "callingMethod", logDataExclude, { meta: "info" });
    });
    it("debug", async () => {
        eLogger.debug("message", "callingMethod", logCallBack, { meta: "data" }, new Error());
        eLogger.log("debug", "message", "callingMethod", logCallBack, { meta: "debug" });
    });
});

describe("details", () => {
    it("logCallBack", async () => {
        eLogger.debug("message", "callingMethod", logCallBack);
    });
    it("logData", async () => {
        eLogger.debug("message", "callingMethod", logData);
    });
    it("logCallBackException", async () => {
        eLogger.debug("message", "callingMethod", logCallBackException);
    });
    it("logCallBackException", async () => {
        eLogger.debug("message", "callingMethod", logCallBack, undefined, errortoJSONException);
    });
});

describe("Initialisation", () => {
    it("Should create a logger instance for default loki logger", async () => {
        eLogger.info("Test info", "test", undefined, { test1: 2 });
        eLogger.error("Test error", "test", undefined, { test1: 3, complex: { subc1: { subc2: "asdfc" } } });
        eLogger.error("Test without", "test", undefined, { test1: 3, complex: { subc1: { subc2: "asdfc" } } }, new Error("Brutal error"));
    });

    it("Should create a logger instance for multilabel loki server", async () => {
        eLogger.info("Test info for diagnostics", "test", undefined, { test1: 2, lokiLabelsKey: "diagnostics" });
        eLogger.info("Test info for diagnostics", "test", undefined, { test1: 2, lokiLabelsKey: "diagnostics" });
        eLogger.error("Test error for diagnostics", "test", undefined, { test1: 3, lokiLabelsKey: "diagnostics", complex: { subc1: { subc2: "asdfc" } } });
        eLogger.error("Test without for diagnostics", "test", undefined, { test1: 3, lokiLabelsKey: "diagnostics", complex: { subc1: { subc2: "asdfc" } } }, new Error("Brutal error"));
        eLogger.info("Test info ==NOT== for diagnostics", "test", undefined, { test1: 2 });
        eLogger.info("Test info ==NOT== for diagnostics", "test", undefined, { test1: 2 });
        eLogger.error("Test error ==NOT== for diagnostics", "test", undefined, { test1: 3, complex: { subc1: { subc2: "asdfc" } } });
        eLogger.error("Test without ==NOT== for diagnostics", "test", undefined, { test1: 3, complex: { subc1: { subc2: "asdfc" } } }, new Error("Brutal error"));
    });
});

describe("lokiWinstonTransport", () => {
    const logger = new ELogger(true);
    beforeAll(() => {
        logger.setCallback((context: IFinalLogData) => context);
        const multipleLabels = new Map<string, ILokiConfigLabels>([
            [
                "test",
                {
                    environment: "development",
                    instance: "jest-test",
                    job: "jest-test"
                }
            ]
        ]);

        logger.init({
            logLevel: "debug",
            lokiLog: {
                host: "https://log.meetings.procall.de:3200/loki/api/v1/push",
                labels: { job: "test", environment: "development", instance: "localhost" },
                basicAuth: "meetings:RLxKTobhKd6SUYYeoUDs",
                useCache: true,
                alternateLabels: multipleLabels
            },
            infrastructure: {
                environment: "test",
                role: "execute_test",
                role_instance: 0,
                servername: "test.estos.de"
            }
        });
    });
    afterAll(() => {
        logger.exit();
    });
    it("caching", async () => {
        logger.debug("some cache test debug", "lokiWinstonTransport_with_cache", logData, { meta: "data" });
        logger.error("some cache test error", "lokiWinstonTransport_with_cache", logData, { meta: "data" });
        logger.info("some cache test info", "lokiWinstonTransport_with_cache", logData, { meta: "data" });
        logger.warn("some cache test warn", "lokiWinstonTransport_with_cache", logData, { meta: "data" });
    });
    it("lokiLabelsKey", async () => {
        const cb = jest.fn()
        logger.debug("some cache test debug", "lokiWinstonTransport_with_cache", logData, { meta: "data", cb, lokiLabelsKey: lokiLabelKey });
        console.log(cb);
    });
});
// });
