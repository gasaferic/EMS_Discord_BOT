const Command = require('./Command');

class CommandManager {

    constructor(badgeGuild, commandsObj) {
        this.badgeGuild = badgeGuild;

        this.currentServer = badgeGuild.currentServer;
        this.mySQLManager = badgeGuild.mySQLManager;
        this.badgeGuildSettings = badgeGuild.badgeGuildSettings;
        this.targetRoles = badgeGuild.targetRoles;

        this.commands = [];
        for (var commandObj of commandsObj) {
            if (this.getCommandByName(commandObj.command) != null) { console.log("Comando " + commandObj.command + " già registrato salto il duplicato"); return; }
            this.commands.push(new Command(this, commandObj.command, commandObj.argsLength, commandObj.adminRequired, commandObj.requiresChannelAsArg, commandObj.commandFunctionString));
        }
    }

    containsValue(array, field, value) {
        for (var elem of array) {
            if (elem[field] != undefined && elem[field] == value) {
                return true;
            }
        }
        return false;
    }

    removeElemByValue(array, field, value) {
        for (var elem of array) {
            if (elem[field] != undefined && elem[field] == value) {
                array.splice(array.indexOf(elem), 1);
            }
        }
    }

    registerCommand(...commandObjs) {
        for (var commandObj of commandObjs) {
            if (this.getCommandByName(commandObj.command) != null) { console.log("Comando " + commandObj.command + " già registrato salto il duplicato"); continue; }
            this.commands.push(new Command(this.eventEmitter, commandObj.command, commandObj.argsLength));
        }
    }

    getCommandByName(commandName) {
        for (var command of this.commands) {
            if (command.commandName == commandName) { return command; }
        }
        return null;
    }

}



module.exports = CommandManager