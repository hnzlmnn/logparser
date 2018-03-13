const debug = require("debug")("loganalyzer:debug");
const error = require("debug")("loganalyzer:error");
const fs = require("fs");
const glob = require("glob-fs")();

function LineStream(fileglob) {
    this.fileglob = fileglob;
    try {
        this.files = glob.readdirSync(this.fileglob, { cwd: "/" });
        this.files = this.files.map(file => {
            return "/" + file;
        })
    } catch(e) {
        error(`No files found for "${this.fileglob}"`);
        debug(e);
        this.files = [];
    }
    this.handlers = {};
}

LineStream.prototype.on = function(event, handler) {
    if (this.handlers[event] === undefined) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
    return this;
};

LineStream.prototype.emit = function(event, ...args) {
    if (this.handlers[event] !== undefined) {
        for (let i = 0; i < this.handlers[event].length; i++) {
            this.handlers[event][i].apply(this, args);
        }
    }
    return this;
};

LineStream.prototype.stream = function() {
    let line = "";
    for (let i = 0; i < this.files.length; i++) {
        debug(`Reading file "${this.files[i]}"`);
        fs.createReadStream(this.files[i]).on("data", (chunk) => {
            const parts = (line + chunk).split("\n");
            for (let j = 0; j < parts.length - 1; j++) {
                this.emit("line", parts[j] + "\n");
            }
            line = parts.length > 1 ? parts[parts.length - 1] : "";
        }).on("end", () => {
            if (line !== "") {
                this.emit("line", line);
                line = "";
            }
            this.emit("end");
        }).on("error", () => {
            error(`Error while reading file "${this.fileglob}".`);
            this.emit("end");
        });
    }
    return this;
};

module.exports = LineStream;
