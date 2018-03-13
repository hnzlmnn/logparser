const LogSet = require("./lib/logset");

const log = new LogSet("logs/**/*.log");

// log.search({
//     extract: json => {
//         return ["realip"];
//     },
//     callback: entry => {
//         console.log(entry);
//     }
// });

log.contains({
    property: "url",
    value: "/user/"
}).on("entry", entry => {
    console.log(entry)
});

log.contains({
    property: "message",
    value: "Unknown"
}).on("entry", entry => {
    console.log(entry)
});

log.count({
    selector: json => {
        return json.action === "recv" && json.message.indexOf("id") !== -1
    }
}).then(count => {
    console.log(`${count} entries`);
});

// log.unique({
//     selector: json => {
//         return json.action === "recv" && json.message.indexOf("id") !== -1
//     }
// }).then(count => {
//     console.log(`${count} entries`);
// });
