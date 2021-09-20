class ContextCommandBuilder {
    constructor(name, type) {
        if (!name) { throw "Non è possibile inizializzare un ContextCommand senza un nome!" }
        this.name = name;
        this.type = type;
    }

    toJSON() {
        var json = JSON.parse("{}");
        json["name"] = this.name;
        json["type"] = this.type;
        return json;
    }
}

module.exports = ContextCommandBuilder