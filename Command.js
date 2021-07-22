class Command {

    constructor(commandManager, commandName, requiredArgsLength, adminRequired, requiresChannelAsArg, commandFunctionString, enabled) {
        this.commandManager = commandManager;
        this.commandName = commandName;
        this.requiredArgsLength = requiredArgsLength || 0;
        this.adminRequired = adminRequired;
        this.requiresChannelAsArg = requiresChannelAsArg;
        this.execute = eval('(' + commandFunctionString + ')');
        this.enabled = enabled || true;
        // console.log("new command", commandName, "required args length", this.requiredArgsLength, "enabled", this.enabled)
    }

    isRequiredAdmin() {
        return this.adminRequired;
    }

    enoughArgs(args) {
        return (args.length >= this.requiredArgsLength || (args == undefined && this.requiredArgsLength == undefined));
    }

    execute() {}
}

module.exports = Command