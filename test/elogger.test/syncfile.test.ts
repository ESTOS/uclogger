import ELogger from "../../src/elogger";
import fs from "fs";
import path from "path";
import { TestInfrastructureConfig } from "../test.config";

const FILE_LOGGER_PATH = path.join(__dirname, "..", "synclogger");

const deleteFilesInDir = ((directory: string): void => {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory);
    } else {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            fs.unlinkSync(path.join(directory, file));
        }
    }
});

describe("Test file logger", () => {
    beforeEach(() => {
        deleteFilesInDir(FILE_LOGGER_PATH);
    })

    afterEach(() => {
        // deleteFilesInDir(FILE_LOGGER_PATH);
    })

    it("general file logger", async () => {
        const logFilename = FILE_LOGGER_PATH + "/synclog.log";
        const eLogger = new ELogger();
        const level = "debug";
        eLogger.init({
            infrastructure: TestInfrastructureConfig,
            logLevel: level,
            fileLog: {
                logDirectory: FILE_LOGGER_PATH,
                logFilename: "synclog.log",
                bSyncLogging: true,
                logLevel: "debug",
                filter: {
                    debug: {
                        excludeMethodNames: ["IgnoreMe"]
                    }
                }
            }
        });
        const message = "Test";
        const method = "general file logger";
        const className = "file.test.ts";
        const meta = { "metaData": "metaValue" };
        eLogger.debug(message, method, { className }, meta);
        eLogger.debug("Ignore me", "IgnoreMe", { className }, meta);
        // Check file is written with the expected lines
        const fileData = fs.readFileSync(logFilename, { encoding: "utf8" });
        const lines = fileData.trim().split(/\r\n|\n/)
        expect(lines.length).toBe(2)
        if (lines[0])
            expect(JSON.parse(lines[0])).toEqual({
                className: "ELogger",
                level: "debug",
                message: "Logging started with loglevel: debug",
                method: "init",
                time: expect.any(String)
            });
        if (lines[1])
            expect(JSON.parse(lines[1])).toEqual(
                { className, level, message, meta, method, time: expect.any(String) }
            );
    });
});