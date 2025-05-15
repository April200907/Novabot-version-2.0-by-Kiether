module.exports = {
  name: "help",
  usage: "help [command_name] | help all",
  version: "2.0",
  description: "Show available commands or details about a specific one",
  usePrefix: false,

  execute({ api, event, args }) {
    const { threadID, messageID } = event;

    const formatCommands = (title, cmds) => {
      if (cmds.length === 0) return "";
      const commandLines = cmds.map(cmd => `✯ ${cmd.name}`).join("\n");
      return `⭕「 ${title.toUpperCase()} 」\n${commandLines}\n◈━━━━━━━━━━━━◈\n`;
    };

    // Show specific command info
    if (args.length > 0 && args[0].toLowerCase() !== "all") {
      const command = global.commands.get(args[0].toLowerCase());
      if (!command) {
        return api.sendMessage(`❌ Command '${args[0]}' not found.`, threadID, messageID);
      }

      const cmdInfo = `
┏━━━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅
┃ ✯ Command: ${command.name}
┃ ✯ Usage: ${command.usage || "None"}
┃ ✯ Prefix: ${command.usePrefix ? "Yes" : "No"}
┃ ✯ Admin Only: ${command.admin ? "Yes" : "No"}
┃ ✯ Version: ${command.version || "1.0"}
┗━━━┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅┅`;
      return api.sendMessage(cmdInfo, threadID, messageID);
    }

    // Show all commands
    const commands = Array.from(global.commands.values());
    const adminCommands = commands.filter(cmd => cmd.admin);
    const groupCommands = commands.filter(cmd => cmd.group);
    const otherCommands = commands.filter(cmd => !cmd.admin && !cmd.group);

    const helpMsg = `Hey ${event.senderName || "user"}, these are commands that may help you:\n\n` +
      formatCommands("general", otherCommands) +
      formatCommands("admin", adminCommands) +
      formatCommands("group", groupCommands) +
      `Use "help [command_name]" for more info.`;

    return api.sendMessage(helpMsg.trim(), threadID, messageID);
  }
};