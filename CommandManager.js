const Command = require('./Command');

class CommandManager {

    constructor(badgeGuild, commandsArray) {
        this.badgeGuild = badgeGuild;

        this.currentServer = badgeGuild.currentServer;
        this.mySQLManager = badgeGuild.mySQLManager;
        this.badgeGuildSettings = badgeGuild.badgeGuildSettings;
        this.targetRoles = badgeGuild.targetRoles;

        this.commands = [];
        for (var commandObj of commandsArray) {
            if (this.getCommandByName(commandObj.command) != null) { console.log("Comando " + commandObj.command + " già registrato salto il duplicato"); return; }
            this.commands.push(new Command(this, commandObj.command, commandObj.argsLength, commandObj.requiresChannelAsArg))
        }
    }

    commandExecution(commandData) {
        var executedCommand = commandData.command;
        var executedCommandArgs = commandData.args;

        if (executedCommand == "espelli") {
            if (!executedCommandArgs[0].includes("<@!")) { return; }
            var userId = executedCommandArgs[0].match('\<@!(.*?)\>')[1];
            this.badgeGuild.forceTimbraOut(userId, executedCommandArgs[1]);
        } else if (executedCommand == "addrole") {
            if (!executedCommandArgs[0].includes("<@&")) { return; }
            var roleId = executedCommandArgs[0].match('\<@&(.*?)\>')[1];
            if (this.containsValue(this.targetRoles, "id", roleId)) { return; }
            var role = this.currentServer.roles.cache.get(roleId);
            this.targetRoles.push({ "name": role.name, "id": role.id, "inServizio": [] });
            this.badgeGuild.eventEmitter.emit('updateGuildSettingsRoles');
        } else if (executedCommand == "removerole") {
            if (!executedCommandArgs[0].includes("<@&")) { return; }
            var roleId = executedCommandArgs[0].match('\<@&(.*?)\>')[1];
            if (!this.containsValue(this.targetRoles, "id", roleId)) { return; }
            this.removeElemByValue(this.targetRoles, "id", roleId);
            this.badgeGuild.eventEmitter.emit('updateGuildSettingsRoles');
        } else if (executedCommand == "setbadgechannel") {
            this.badgeGuildSettings.setValue("badgeChannel", executedCommandArgs[0])
            this.badgeGuild.eventEmitter.emit('updateGuildSettingsRoles');
        } else if (executedCommand == "setlogchannel") {
            this.badgeGuildSettings.setValue("logChannel", executedCommandArgs[0])
            this.badgeGuild.eventEmitter.emit('updateGuildSettingsRoles');
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