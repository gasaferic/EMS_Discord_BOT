const fs = require("fs");

class Parser {
    constructor (data) {
        this.eventEmitter = data.eventEmitter;
        this.utils = data.utils;
        this.inputDir = data.inputDir + "new";
        this.oldLogsDir = data.inputDir + "old";
        this.outputDir = data.outputDir;
        this.parsedData = new Map();
        if (!fs.existsSync(this.inputDir)) { fs.mkdirSync(this.inputDir, { recursive: true }); }
        if (!fs.existsSync(this.oldLogsDir)) { fs.mkdirSync(this.oldLogsDir, { recursive: true }); }
        if (!fs.existsSync(this.outputDir)) { fs.mkdirSync(this.outputDir, { recursive: true }); }
        this.loadParsedFiles();
        this.parseOldData();
    }

    loadParsedFiles() {
        var startingTime = performance.now();
        for (var parsedFileName of fs.readdirSync(this.outputDir)) {
            if (!parsedFileName.endsWith(".json")) { continue; }
            var date = parsedFileName.match(/logs_(.*)\.json/)[1];
            var dayParsedData = require(this.outputDir + "/" + ("logs_" + date + ".json"));
            this.parsedData.set(date, this.utils.getMapFromJSON(dayParsedData));
        }
        this.eventEmitter.emit("fileParsingDone", (performance.now() - startingTime));
    }

    parseOldData() {
        for (var fileName of fs.readdirSync(this.inputDir)) {
            if (!fileName.endsWith(".txt")) { continue; }
            var currentDate = this.getDateFromString(fileName.match(/logs_(.*)\.txt/)[1]);
            if (this.parsedData.has(currentDate.join("-"))) {
                this.parse({ fileName: fileName, parsedDataMap: this.parsedData.get(currentDate.join("-")) });
            } else {
                this.parse({ fileName: fileName });
            }
        }
    }

    parseLog(date) {
        for (var fileName of fs.readdirSync(this.inputDir)) {
            if (!fileName.endsWith(".txt")) { continue; }
            var currentDate = this.getDateFromString(fileName.match(/logs_(.*)\.txt/)[1]);
            if (currentDate[0] != date.getUTCDate() || currentDate[1] != (date.getUTCMonth() + 1) || currentDate[2] != date.getUTCFullYear()) { continue; }
            
            if (this.parsedData.has(currentDate.join("-"))) {
                this.parse({ fileName: fileName, parsedDataMap: this.parsedData.get(currentDate.join("-")) });
            } else {
                this.parse({ fileName: fileName });
            }
        }
    }

    parse(data) {
        const dailyMap = data.parsedDataMap || new Map();
        const file = fs.readFileSync(this.inputDir + "/" + data.fileName, "utf-8");
        const lines = file.split("\n");
        for (var line of lines) {
            if (line == "") { continue; }
            var roleMatch = line.match(/RID\[ROLE\_ID(.*)\]\/RID/);
            var roleId = roleMatch[1];
            if (!dailyMap.has(roleId)) { dailyMap.set(roleId, new Map()); }
            var userMatch = line.match(/ID\[ID\_(.*)\]\/ID/);
            var userId = userMatch[1];
            if (!dailyMap.get(roleId).has(userId)) { dailyMap.get(roleId).set(userId, new Map()); }
            var actionMatch = line.match(/A\[(.*)\]\/A/);
            var action = actionMatch[1];
            var millisMatch = line.match(/TS\[(.*)\]\/TS/);
            dailyMap.get(roleId).get(userId).set(millisMatch[1], action);
        }

        for (var role of dailyMap.keys()) {
            var currentRoleTimestamps = dailyMap.get(role);
            for (var user of currentRoleTimestamps.keys()) {
                currentRoleTimestamps.set(user, new Map([...currentRoleTimestamps.get(user).entries()].sort((firstTimestamp, secondTimestamp) => parseInt(firstTimestamp) - parseInt(secondTimestamp))));
                var entries = [...currentRoleTimestamps.get(user).entries()];
                var firstElem = entries[0];
                if (firstElem[1] == "SERVIZIO_OFF") {
                    currentRoleTimestamps.get(user).set("" + this.utils.getClearedTime(parseInt(firstElem), "day").getTime(), "SERVIZIO_ON");
                    currentRoleTimestamps.set(user, new Map([...currentRoleTimestamps.get(user).entries()].sort((firstTimestamp, secondTimestamp) => parseInt(firstTimestamp) - parseInt(secondTimestamp))));
                }
                if (currentRoleTimestamps.get(user).size % 2 != 0) {
                    var entries = [...currentRoleTimestamps.get(user).entries()];
                    var lastElem = entries[currentRoleTimestamps.get(user).size - 1];
                    if (lastElem[1] == "SERVIZIO_ON") {
                        currentRoleTimestamps.get(user).set("" + (this.utils.getClearedTime(parseInt(firstElem), "day").getTime() + 86399000), "SERVIZIO_OFF");
                        currentRoleTimestamps.set(user, new Map([...currentRoleTimestamps.get(user).entries()].sort((firstTimestamp, secondTimestamp) => parseInt(firstTimestamp) - parseInt(secondTimestamp))));
                    }
                }
            }
        }

        if (data.parsedDataMap) {
            fs.unlinkSync(this.outputDir + "/" + data.fileName.replace("txt", "json"));
        }
        fs.appendFileSync(this.outputDir + "/" + data.fileName.replace("txt", "json"), this.utils.getJSONFromMap(dailyMap));
        fs.appendFileSync(this.oldLogsDir + "/" + data.fileName, file);
        fs.unlinkSync(this.inputDir + "/" + data.fileName, "utf-8");
    }

    unifyDailyReports(report) {
        const roleBasedMap = new Map();
        for (var key of report.keys()) {
            var currentDay = report.get(key);
            for (var roleKey of currentDay.keys()) {
                if (!roleBasedMap.has(roleKey)) { roleBasedMap.set(roleKey, new Map()); }
                var currentRole = currentDay.get(roleKey);
                for (var userKey of currentRole.keys()) {
                    if (!roleBasedMap.get(roleKey).has(userKey)) { roleBasedMap.get(roleKey).set(userKey, new Map()); }
                    var currentUser = currentRole.get(userKey);
                    for (var timestampKey of currentUser.keys()) {
                        roleBasedMap.get(roleKey).get(userKey).set(timestampKey, currentUser.get(timestampKey));
                    }
                }
            }
        }
        return roleBasedMap;
    }

    getComputedHours(report) {
        if (report == undefined) { console.log("Non è stato passato un report!"); return; }
        const computedHoursReports = new Map();
        for (var roleKey of report.keys()) {
            if (!computedHoursReports.has(roleKey)) { computedHoursReports.set(roleKey, new Map()); }
            var currentRole = report.get(roleKey);
            for (var userKey of currentRole.keys()) {
                if (!computedHoursReports.get(roleKey).has(userKey)) { computedHoursReports.get(roleKey).set(userKey, 0); }
                var currentUser = currentRole.get(userKey);
                var count = 0;
                var timestampsDifference = []
                for (var timestampKey of currentUser.keys()) {
                    timestampsDifference.push(parseInt(timestampKey));
                    if (++count == 2) {
                        computedHoursReports.get(roleKey).set(userKey, computedHoursReports.get(roleKey).get(userKey) + (timestampsDifference[1] - timestampsDifference[0]));
                        count = 0;
                        timestampsDifference = [];
                    }
                }
            }
        }
        return computedHoursReports;
    }

    getDateFromString(dateString) {
        return dateString.split("-");
    }

    hasParsedDate(date) {
        return this.parsedData.has(date);
    }

    getParsedDate(date) {
        return this.parsedData.get(date);
    }

}

module.exports = Parser