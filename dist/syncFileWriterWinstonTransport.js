"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const winston_transport_1 = __importDefault(require("winston-transport"));
/**
 * Loki module for winston transport
 */
class SyncFileWriterWinstonTransport extends winston_transport_1.default {
    /**
     * Initialise winston module for loki
     *
     * @param opts - options
     * @param iPrettyPrint - pretty print the messages
     */
    constructor(opts, iPrettyPrint = 0) {
        super(opts);
        this.iPrettyPrint = 0;
        this.iPrettyPrint = iPrettyPrint;
        if (!opts || !opts.filename)
            throw Error("Missing parameter opts.filePath");
        // Check if file exists
        if (!fs_1.default.existsSync(path_1.default.dirname(opts.filename)))
            fs_1.default.mkdirSync(path_1.default.dirname(opts.filename));
        this.filePath = opts.filename;
        // Create file (test write)
        fs_1.default.writeFileSync(this.filePath, "", { flag: "w+" });
    }
    /**
     * callback from winston tansport to process logs
     *
     * @param info - log data
     * @param callback - callback to call once log is processed
     */
    log(info, callback) {
        const toWrite = JSON.stringify(info, undefined, this.iPrettyPrint) + "\n";
        fs_1.default.writeFileSync(this.filePath, toWrite, { flag: "as" });
        callback();
    }
}
exports.default = SyncFileWriterWinstonTransport;
//# sourceMappingURL=syncFileWriterWinstonTransport.js.map