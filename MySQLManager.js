const LangManager = require('./LangManager');
const mySQL = require('mysql');

class MySQLManager {

    constructor(data) {
        this.langManager = new LangManager("mysql");
        this.eventEmitter = data.eventEmitter;
        this.init(data.mysqlConnectionParams);
    }

    init(mysqlConnectionParams) {
	    this.mysqlConnectionParams = mysqlConnectionParams;
        this.connection = new mySQL.createConnection({ host: mysqlConnectionParams.host, port: mysqlConnectionParams.port || 3306, database: mysqlConnectionParams.database, user: mysqlConnectionParams.user, password: mysqlConnectionParams.password, charset : "utf8mb4" });
        this.connection.connect(function(err) {
            this.eventEmitter.emit("mysql_connection_ready", { host: mysqlConnectionParams.host, database: mysqlConnectionParams.database, user: mysqlConnectionParams.user});
            this.connection.on("error", function(err) {
		        this.reconnect();
            }.bind(this));
        }.bind(this));
    }

    getGuilds(cb) {
        if (this.connection == undefined) { throw this.langManager.getString("CONNECTION_NOT_AVAILABLE"); }
        this.connection.query("SELECT * FROM guilds", function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) { cb(result); } else { cb([]); }
        });
    }

    addGuild(data) {
        if (this.connection == undefined) { throw this.langManager.getString("CONNECTION_NOT_AVAILABLE"); }
        this.connection.query(this.getPreparedStatement("INSERT INTO guilds (guild_id, guild_name, guild_owner_id, guild_settings) values (?,?,?,?)", [data.guild.id, data.guild.name, data.guild.owner.id, data.guildSettings]), function (err, result, fields) {
            if (err) throw err;
        });
    }

    removeGuildById(id) {
        if (this.connection == undefined) { throw this.langManager.getString("CONNECTION_NOT_AVAILABLE"); }
        this.connection.query(this.getPreparedStatement("DELETE FROM guilds WHERE guild_id = ?", [id]), function (err, result, fields) {
            if (err) throw err;
        });
    }

    getGuildSettingsById(id, cb) {
        if (this.connection == undefined) { throw this.langManager.getString("CONNECTION_NOT_AVAILABLE"); }
        this.connection.query(this.getPreparedStatement("SELECT * FROM guilds WHERE guild_id = ?", [id]), function (err, result, fields) {
            if (err) throw err;
            if (result.length > 0) { cb(result[0].guild_settings); } else { cb(); }
        });
    }

    updateGuildSettingsById(id, guildSettings) {
        if (this.connection == undefined) { throw this.langManager.getString("CONNECTION_NOT_AVAILABLE"); }
        this.connection.query(this.getPreparedStatement("UPDATE guilds SET guild_settings = ? WHERE guild_id = ?", [guildSettings, id]), function (err, result, fields) {
            if (err) throw err;
        });
    }

    getPreparedStatement(queryString, values) {
        var valuesToReplace = 0;
        if ((valuesToReplace = queryString.split('?').length - 1) < 1) { throw this.langManager.getString("BAD_QUERY_SYNTAX"); }
        if (valuesToReplace != values.length) { throw this.langManager.getString("QUERY_PASSED_VALUES_MISMATCH", valuesToReplace, values.length); }
        for (var i = 0; i < valuesToReplace; i++) {
            values[i] = "'" + values[i] + "'"
            queryString = queryString.replace(queryString.charAt(queryString.indexOf('?')), values[i])
        }
        return queryString;
    }

    reconnect() {
        this.connection = new mySQL.createConnection({ host: this.mysqlConnectionParams.host, port: this.mysqlConnectionParams.port || 3306, database: this.mysqlConnectionParams.database, user: this.mysqlConnectionParams.user, password: this.mysqlConnectionParams.password, charset : "utf8mb4" });
        this.connection.connect(function(err) {
		this.connection.on("error", function(err) {
			this.reconnect();
		}.bind(this));
        }.bind(this));
    }
}

module.exports = MySQLManager
