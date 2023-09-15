import { LogEntry } from "winston";
import TransportStream from "winston-transport";
import { ILokiConfig, ILokiConfigLabels } from "./types";
/**
 * Loki module for winston transport
 */
declare class LokiWinstonTransport extends TransportStream {
    host: string;
    alternateLabels: Map<string, ILokiConfigLabels> | undefined;
    labels: ILokiConfigLabels;
    auth?: string;
    /**
     * Initialise winston module for loki
     *
     * @param opts - options
     */
    constructor(opts: ILokiConfig);
    /**
     * callback from winston tansport to process logs
     *
     * @param info - log data
     * @param callback - callback to call once log is processed
     */
    log(info: LogEntry, callback: () => void): void;
}
export default LokiWinstonTransport;
//# sourceMappingURL=lokiWinstonTransport.d.ts.map