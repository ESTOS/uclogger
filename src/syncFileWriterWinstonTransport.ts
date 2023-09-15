import fs from "fs";
import path from "path";
import { LogEntry } from "winston";
import { FileTransportOptions } from "winston/lib/winston/transports";
import TransportStream from "winston-transport";

/**
 * Loki module for winston transport
 */
class SyncFileWriterWinstonTransport extends TransportStream {
	private filePath: string;
	private iPrettyPrint = 0;

	/**
	 * Initialise winston module for loki
	 *
	 * @param opts - options
	 * @param iPrettyPrint - pretty print the messages
	 */
	public constructor(opts: FileTransportOptions, iPrettyPrint = 0) {
		super(opts as TransportStream.TransportStreamOptions);
		this.iPrettyPrint = iPrettyPrint;

		if (!opts || !opts.filename)
			throw Error("Missing parameter opts.filePath");

		// Check if file exists
		if (!fs.existsSync(path.dirname(opts.filename)))
			fs.mkdirSync(path.dirname(opts.filename));

		this.filePath = opts.filename;
		// Create file (test write)
		fs.writeFileSync(this.filePath, "", { flag: "w+" });
	}

	/**
	 * callback from winston tansport to process logs
	 *
	 * @param info - log data
	 * @param callback - callback to call once log is processed
	 */
	public override log(info: LogEntry, callback: () => void) {
		const toWrite = JSON.stringify(info, undefined, this.iPrettyPrint) + "\n";
		fs.writeFileSync(this.filePath, toWrite, { flag: "as" });
		callback();
	}
}

export default SyncFileWriterWinstonTransport;
