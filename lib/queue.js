const EventTarget = require("./eventtarget");

function Queue() {
    this.queue = [];
    this.running = false;
}

Queue.prototype.enqueue = function(action, autostart = false) {
    this.queue.push(action);
    if (autostart === true)
        this.tick();
    return this;
};

Queue.prototype.finish = function() {
    this.running = false;
    this.tick();
};

Queue.prototype.start = function() {
    this.tick();
};

Queue.prototype.tick = function() {
    if (!this.running && this.queue.length > 0) {
        this.running = true;
        const action = this.queue.splice(0, 1)[0];
        if (typeof action !== typeof function(){}) {
            return this.finish();
        }
        const result = action();
        if (result === undefined) {
            return this.finish();
        } else if (result instanceof Promise) {
            result.then(() => {
                return this.finish();
            }).catch(() => {
                return this.finish();
            });
        } else if (result instanceof EventTarget) {
            result.on("end", () => {
                return this.finish();
            }).on("error", () => {
                return this.finish();
            });
        } else if (result === false) {
            return undefined;
        } else {
            return this.finish();
        }
    }
};

module.exports = Queue;