const fs = require("fs");
const LogSet = require("./lib/logset");
const Queue = require("./lib/queue");

const log = require("debug")("loganalyzer:log");


const queue = new Queue();
queue.enqueue(() => {
    log("Do something with the log");
    const logset = new LogSet(`logs/**/*.log`);
    return logset.count().then(count => {
        console.log(`There are ${count} log entries.`);
    })
});
queue.start();