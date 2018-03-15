const debug = require("debug")("loganalyzer:debug");
const error = require("debug")("loganalyzer:error");

const path = require("path");
const assert = require("assert");
const LineStream = require("./linestream");
const EventTarget = require("./eventtarget");

function LogSet(list) {
    if (list === undefined) {
        list = ""
    }
    if (typeof list === typeof "") {
        list = [list];
    } this.filelist = list;
}

LogSet.prototype.search = function(property, value, extract) {
    const sink = new EventTarget();
    let callback = undefined;
    let selector = undefined;
    let following = undefined;
    if (typeof property === typeof {}) {
        callback = property.callback;
        selector = property.selector;
        extract = property.extract;
        value = property.value;
        following = property.following;
        property = property.property;
    }
    if (selector === undefined) {
        selector = json => {
            if (property === undefined) {
                return true;
            }
            if (json.hasOwnProperty(property)) {
                if (value === undefined) {
                    return true;
                }
                return json[property] === value;
            }
            return false;
        };
    }
    if (typeof property === typeof function () {}) {
        extract = property;
        property = undefined;
        value = undefined;
    } else if (typeof value === typeof function () {
        }) {
        extract = value;
        value = undefined;
    }
    let extractor = json => {
        return json;
    };
    if (typeof extract === typeof "") {
        extract = [extract];
    }
    if (Array.isArray(extract)) {
        extractor = json => {
            const entry = {};
            for (let i = 0; i < extract.length; i++) {
                if (json.hasOwnProperty(extract[i])) {
                    entry[extract[i]] = json[extract[i]];
                }
            }
            if (entry !== {}) {
                return entry;
            }
            return false;
        };
    }
    if (typeof extract === typeof function () {}) {
        extractor = extract;
    }
    let readCount = this.filelist.length;
    for (let i = 0; i < this.filelist.length; i++) {
        const ls = new LineStream(path.resolve(__dirname, "..", this.filelist[i]));
        let remaining = 0;
        ls.on("line", line => {
            let json;
            try {
                json = JSON.parse(line);
            } catch (e) {
                error(`An error while parsing the following JSON: ${line}`);
                debug(e);
                return;
            }
            if (selector(json) || remaining > 0) {
                remaining = following || 0;
                const extracted = extractor.call(this, json);
                let entry = {};
                if (Array.isArray(extracted)) {
                    for (let j = 0; j < extracted.length; j++) {
                        if (json.hasOwnProperty(extracted[j])) {
                            entry[extracted[j]] = json[extracted[j]];
                        }
                    }
                } else {
                    entry = extracted;
                }
                if (typeof entry === typeof {}) {
                    sink.emit("entry", entry);
                    if (typeof callback === typeof function(){}) {
                        callback.call(this, entry);
                    }
                }
                remaining--;
            }
        }).on("end", () => {
            if (--readCount === 0) {
                sink.emit("end");
            }
        }).on("error", error => {
            sink.emit("error", error);
        }).stream();
    }
    return sink;
};

LogSet.prototype.count = function (property, value) {
    return new Promise((resolve, reject) => {
        let count = 0;
        this.search(property, value).on("entry", () => {
            count++;
        }).on("end", () => {
            resolve(count);
        }).on("error", error => {
            reject(error);
        });
    });
};

LogSet.prototype.contains = function (...args) {
    const options = {};
    if (typeof args[0] === typeof {}) {
        for (k in args[0]) {
            if (args[0].hasOwnProperty(k)) {
                options[k] = args[0][k];
            }
        }
        options.selector = json => {
            return options.property === undefined || (json.hasOwnProperty(options.property) && json[options.property].indexOf(options.value) !== -1)
        };
    } else {
        if (args.length > 1) {
            options.selector = json => {
                return args[0] === undefined || (json.hasOwnProperty(args[0]) && json[args[0]].indexOf(args[1]) !== -1)
            };
        }
        if (args.length > 2) {
            options.extract = args[2];
        }
    }
    return this.search(options);
};

LogSet.prototype.accumulate = function (...args) {
    return new Promise((resolve, reject) => {
        const logs = [];
        this.search.apply(this, args).on("entry", entry => {
            logs.push(entry);
        }).on("end", () => {
            resolve(logs);
        }).on("error", error => {
            reject(error);
        });
    });
};

LogSet.prototype.unique = function (...args) {
    return new Promise((resolve, reject) => {
        const logs = [];
        this.search.apply(this, args).on("entry", entry => {
            let exists = false;
            for (let i = 0; i < logs.length; i++) {
                try {
                    assert.deepEqual(logs[i], entry);
                    exists = true;
                    break;
                } catch (e) {

                }
            }
            if (!exists)
                logs.push(entry);
        }).on("end", () => {
            resolve(logs);
        }).on("error", error => {
            reject(error);
        });
    });
};


module.exports = LogSet;
