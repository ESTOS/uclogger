import { LogEntry } from "winston";
import TransportStream from "winston-transport";
import { FileTransportOptions } from "winston/lib/winston/transports";
/**
 * Loki module for winston transport
 */
declare class SyncFileWriterWinstonTransport extends TransportStream {
    private filePath;
    private iPrettyPrint;
    /**
     * Initialise winston module for loki
     *
     * @param opts - options
     * @param iPrettyPrint - pretty print the messages
     */
    constructor(opts: FileTransportOptions, iPrettyPrint?: number);
    /**
     * callback from winston tansport to process logs
     *
     * @param info - log data
     * @param callback - callback to call once log is processed
     */
    log(info: LogEntry, callback: () => void): void;
}
export default SyncFileWriterWinstonTransport;
//# sourceMappingURL=syncFileWriterWinstonTransport.d.ts.map