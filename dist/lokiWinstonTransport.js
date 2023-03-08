"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const winston_transport_1 = __importDefault(require("winston-transport"));
const post = (lokiUrl, contentType, headers = {}, data = "", auth) => {
    // Construct a buffer from the data string to have deterministic data size
    const dataBuffer = Buffer.from(data, "utf8");
    // Construct the headers
    const defaultHeaders = {
        "Content-Type": contentType,
        "Content-Length": dataBuffer.length
    };
    // Decide which http library to use based on the url
    const isHttps = lokiUrl.protocol === "https:";
    // Construct the node request options
    const options = {
        hostname: lokiUrl.hostname,
        path: lokiUrl.pathname,
        method: "POST",
        headers: Object.assign(defaultHeaders, headers),
        auth: undefined
    };
    if (lokiUrl.port && lokiUrl.port !== "")
        options.port = lokiUrl.port;
    else
        options.port = lokiUrl.protocol === "https:" ? 443 : 80;
    /* istanbul ignore else */
    if (auth != null)
        options.auth = auth;
    // Construct the request
    let req;
    if (isHttps) {
        req = https_1.default.request(options, res => {
            let resData = "";
            res.on("data", data => (resData += data));
            res.on("end", () => {
                if (res && res.statusCode && res.statusCode >= 400)
                    console.error({ message: "Failed to send logs.", data: resData });
            });
        });
    }
    else {
        req = http_1.default.request(options, res => {
            let resData = "";
            res.on("data", data => (resData += data));
            res.on("end", () => {
                if (res && res.statusCode && res.statusCode >= 400)
                    console.error({ message: "Failed to send logs.", data: resData });
            });
        });
    }
    // Error listener
    /* istanbul ignore next */
    req.on("error", error => {
        /* eslint-disable no-console */
        /* istanbul ignore next */
        console.log("Failed to send logs to loki.", error.message);
        /* eslint-enable no-console */
    });
    // Write to request
    req.write(dataBuffer);
    req.end();
};
/**
 * Loki stream object used to send logs to loki
 */
class LokiStream {
    /**
     * Creates LokiStream instance
     *
     * @param time - timestamp
     * @param labels - label
     * @param message - message
     * @param method - method
     * @param className - className
     * @param classProps - classProps
     * @param meta - meta values
     * @param error - error instance
     */
    constructor(time, labels, message, method, className, classProps, meta, error) {
        this.time = time;
        this.stream = labels;
        this.data = {
            message
        };
        if (meta)
            this.data.meta = meta;
        if (method)
            this.data.method = method;
        if (className)
            this.data.className = className;
        if (classProps)
            this.data.classProps = classProps;
        if (error)
            this.data.error = error;
    }
    /**
     * Returns multidimensional array with which can be processed by loki
     *
     * @returns - multi dimensional array
     */
    valuesToString() {
        return [[this.time, JSON.stringify(this.data)]];
    }
}
/**
 * Public loki instance can be parsed as stream or send individually
 */
class LokiLog {
    /**
     * Creates LokiStream instance
     *
     * @param time - timestamp
     * @param labels - label
     * @param message - message
     * @param method - method
     * @param className - className
     * @param classProps - classProps
     * @param meta - meta values
     * @param error - error instance
     */
    constructor(time, labels, message, method, className, classProps, meta, error) {
        this.streams = [];
        this.streams = [];
        this.streams.push(new LokiStream(time, labels, message, method, className, classProps, meta, error));
    }
    /**
     * Parses its stream object to string
     *
     * @returns - string representation of list of loki streams
     */
    toString() {
        return JSON.stringify({
            streams: this.streams.map((stream) => {
                return {
                    stream: stream.stream,
                    values: stream.valuesToString()
                };
            })
        });
    }
}
/**
 * Loki module for winston transport
 */
class LokiWinstonTransport extends winston_transport_1.default {
    /**
     * Initialise winston module for loki
     *
     * @param opts - options
     */
    constructor(opts) {
        super(opts);
        this.alternateLabels = undefined;
        this.host = opts.host;
        // Format { [Label key]: [Labels]} LabelKey can be referenced by a meta attribute "lokiLabelKey"
        // e.g. { diagnostics: {instance: "diagnostics"}, default: {instance: "ucwebinstance"} }
        // When no lokiLabelKey is provided mit meta data label data from opts.labels will be used.
        this.alternateLabels = opts.alternateLabels;
        this.labels = opts.labels;
        this.auth = opts.basicAuth || undefined;
    }
    /**
     * callback from winston tansport to process logs
     *
     * @param info - log data
     * @param callback - callback to call once log is processed
     */
    log(info, callback) {
        /*
            https://github.com/winstonjs/winston-transport/issues/61
            setTimeout(() => {
                this.emit("logged", info);
            }, 0);
        */
        // Parse log
        const dynamicLabels = { level: info.level };
        let labels = dynamicLabels;
        if (this.alternateLabels && "lokiLabelsKey" in info)
            labels = Object.assign(labels, this.alternateLabels.get(info["lokiLabelsKey"]) || this.labels);
        else
            labels = Object.assign(labels, this.labels);
        const time = (new Date(info["time"]).getTime()).toFixed() + "000000";
        const lokiLog = new LokiLog(time, labels, info.message, info["method"], info["className"], info["classProps"], info["meta"], info["cause"]);
        const data = lokiLog.toString();
        if (this.auth)
            post(new URL(this.host), "application/json", {}, data, this.auth);
        else
            post(new URL(this.host), "application/json", {}, data);
        callback();
    }
}
exports.default = LokiWinstonTransport;
//# sourceMappingURL=lokiWinstonTransport.js.map