// const debug = require("debug")("loganalyzer:debug");
// const error = require("debug")("loganalyzer:error");

function EventTarget() {
    this.handlers = {};
}

EventTarget.prototype.on = function(event, handler) {
    if (this.handlers[event] === undefined) {
        this.handlers[event] = [];
    }
    this.handlers[event].push(handler);
    return this;
};

EventTarget.prototype.emit = function(event, ...args) {
    if (this.handlers[event] !== undefined) {
        for (let i = 0; i < this.handlers[event].length; i++) {
            this.handlers[event][i].apply(this, args);
        }
    }
    return this;
};

module.exports = EventTarget;
