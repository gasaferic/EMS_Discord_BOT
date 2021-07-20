class Command {

    constructor(commandManager, commandName, requiredArgsLength, requiresChannelAsArg, enabled) {
        this.commandManager = commandManager;
        this.commandName = commandName;
        this.requiredArgsLength = requiredArgsLength || 0;
        this.requiresChannelAsArg = requiresChannelAsArg;
        this.enabled = enabled || true;
        // console.log("new command", commandName, "required args length", this.requiredArgsLength, "enabled", this.enabled)
    }

    enoughArgs(args) {
        return (args.length >= this.requiredArgsLength || (args == undefined && this.requiredArgsLength == undefined));
    }

    execute(args) {
        this.commandManager.commandExecution({ command: this.commandName, args: args });
    }
}

module.exports = Command