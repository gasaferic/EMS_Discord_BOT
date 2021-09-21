const Discord = require('discord.js');

class GuildSettings {
    settings = {};

    constructor(settingsString) {
        this.settings = this.mapFromJSON(JSON.parse(settingsString));
        // console.log(this.settings)
        this.fixTargetRolesStructure(this.settings, true);
        // console.log(this.getJSONString());
    }

    getSettings() {
        return this.settings;
    }

    get(key) {
        return this.settings.get(key);
    }

    set(key, value) {
        return this.settings.set(key, value);
    }

    fixTargetRolesStructure(settings, add) {
        var roles = settings.get("dutyRoles");
        for (var key of roles.keys()) {
            if (add) {
                roles.get(key).set("inServizio", []);
            } else {
                if (roles.get(key).has("inServizio")) { roles.get(key).delete("inServizio"); };
            }
        }
    }

    getJSONString() {
        return this.jsonFromMap(this.getMapFullClone(this.settings));
    }

    mapFromJSON(jsonObject) {
        var finalMap = new Map();
        for (var elem in jsonObject) {
            if (typeof jsonObject[elem] != "object") { finalMap.set(elem, jsonObject[elem]); } else { finalMap.set(elem, this.getMapFromObject(jsonObject[elem])); }
        }
        return finalMap;
    }

    getMapFromObject(object) {
        var objectMap = new Map();
        for (var elem in object) {
            if (typeof object[elem] != "object") { objectMap.set(elem, object[elem]); } else { objectMap.set(elem, this.getMapFromObject(object[elem])); }
        }
        return objectMap;
    }

    jsonFromMap(map) {
        this.fixTargetRolesStructure(map, false);

        var jsonObject = {};

        for (var key of map.keys()) {
            if (typeof map.get(key) != "object") { jsonObject[key] = map.get(key); } else { jsonObject[key] = this.getObjectFromMap(map.get(key)); }
        }

        return JSON.stringify(jsonObject);
    }

    getObjectFromMap(map) {
        var mapObject = {};
        for (var key of map.keys()) {
            if (typeof map.get(key) != "object") { mapObject[key] = map.get(key); } else { mapObject[key] = this.getObjectFromMap(map.get(key)); }
        }
        return mapObject;
    }

    getMapFullClone(map) {
        const finalMap = new Map();

        for (var key of map.keys()) {
            if (typeof map.get(key) != "object") { finalMap.set(key, map.get(key)); } else { finalMap.set(key, this.cloneMapObject(map.get(key))); }
        }

        return finalMap;
    }

    cloneMapObject(map) {
        const finalMap = new Map();

        for (var key of map.keys()) {
            if (typeof map.get(key) != "object") { finalMap.set(key, map.get(key)); } else { finalMap.set(key, this.cloneMapObject(map.get(key))); }
        }

        return finalMap;
    }
}

module.exports = GuildSettings