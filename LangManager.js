var config = require('./config.json');
const lang = config.lang;

class LangManager {
    langConfigScope;

    constructor(configScope) {
        this.langConfigScope = lang[configScope];
    }

    getString(key, ...values) {
        var langString = this.langConfigScope[key];
        var regexIterator = langString.matchAll('\{(.*?)\}');
        if (regexIterator.length < values.length) { console.log("MISMATCHED VALUES"); return; }
        for (var elem of regexIterator) {
            langString = this.replaceString(langString, elem[0], values[Number(elem[1])]);
        }
        return langString;
    }

    replaceString(string, key, value) {
        return string.substring(0, string.indexOf(key)) + value + string.substring(string.indexOf(key) + key.length, string.length);
    }
}

module.exports = LangManager