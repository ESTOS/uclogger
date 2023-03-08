import ELogger from "../../src/elogger";
import fs from "fs";
import path from "path";
import { TestInfrastructureConfig } from "../test.config";

const FILE_LOGGER_PATH = path.join(__dirname, "..", "loggerdump");

const deleteFilesInDir = ((directory: string): void => {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        fs.unlinkSync(path.join(directory, file));
    }
});

describe("Test file logger", () => {
    beforeEach(() => {
        if(!fs.existsSync(FILE_LOGGER_PATH))
            fs.mkdirSync(FILE_LOGGER_PATH);
        else
            deleteFilesInDir(FILE_LOGGER_PATH);
    })

    afterEach(() => {
        deleteFilesInDir(FILE_LOGGER_PATH);
    })

    it("general file logger", async () => {
        const logFilename = "generalFile.log";
        const eLogger = new ELogger();
        const level = "debug";
        eLogger.init({
            infrastructure: TestInfrastructureConfig,
            logLevel: level,
            fileLog: {
                logDirectory: FILE_LOGGER_PATH,
                logFilename
            }
        });
        const message = "Test";
        const method = "general file logger";
        const className = "file.test.ts";
        const meta = { "metaData": "metaValue" };
        eLogger.debug(message, method, { className }, meta);
        await eLogger.exit();
        // Check file is written with the expected lines
        const fileData = fs.readFileSync(path.join(FILE_LOGGER_PATH, logFilename), { encoding: "utf8" });
        const lines = fileData.trim().split("\r\n")
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

    it("additional method specific file logger", async () => {
        const generalLogFilename = "generalFile.log";
        const methodSpecificLogFilename = "methodSpecificLogFile.log";
        const eLogger = new ELogger();
        const level = "debug";
        const generalMethod = "generalMethod";
        const specialMethod = "specialMethod";
        eLogger.init({
            infrastructure: TestInfrastructureConfig,
            logLevel: level,
            fileLog: [
                {
                    logDirectory: FILE_LOGGER_PATH,
                    logFilename: generalLogFilename,
                    filter: {
                        common: {
                            excludeMethodNames: [specialMethod]
                        }
                    }
                },
                {
                    logDirectory: FILE_LOGGER_PATH,
                    logFilename: methodSpecificLogFilename,
                    filter: {
                        common: {
                            includeMethodNames: [specialMethod]
                        }
                    }
                }
            ]
        });
        const generalMessage = "General message";
        const specialMessage = "Special message";
        const className = "file.test.ts";
        const meta = { "metaData": "metaValue" };
        eLogger.debug(generalMessage, generalMethod, { className }, meta);
        eLogger.debug(specialMessage, specialMethod, { className }, meta);
        await eLogger.exit();
        // Check file is written with the expected lines
        const fileData = fs.readFileSync(path.join(FILE_LOGGER_PATH, generalLogFilename), { encoding: "utf8" });
        const lines = fileData.trim().split("\r\n")
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
                { className, level, message: generalMessage, meta, method: generalMethod, time: expect.any(String) }
            );

        const specialfileData = fs.readFileSync(path.join(FILE_LOGGER_PATH, methodSpecificLogFilename), { encoding: "utf8" });
        const specialLines = specialfileData.trim().split("\r\n")
        expect(specialLines.length).toBe(1)
        if (specialLines[0])
            expect(JSON.parse(specialLines[0])).toEqual({
                className,
                level,
                meta: meta,
                message: specialMessage,
                method: specialMethod,
                time: expect.any(String)
            });
    });
});