const fs = require("fs");
const path = require("path");
const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath));

module.exports = {
    name: "info",
    usePrefix: false,
    usage: "info",
    version: "1.0",
    description: "Displays full bot information.",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event }) => {
        const { threadID } = event;

        const botPrefix = config.prefix || "/";
        const botName = config.botName || "My Bot";
        const developer = "April Macasinag Manalo";
        const version = "NovaBot 2.0";

        // Count command files in same directory
        const commandsDir = path.join(__dirname);
        const allCommands = fs.readdirSync(commandsDir).filter(file => file.endsWith(".js"));
        const commandCount = allCommands.length;

        const uptime = process.uptime();
        const uptimeFormatted = new Date(uptime * 1000).toISOString().substr(11, 8);

        const infoMessage =
`◈━Bot Full Information━◈
✯ Bot Name: ${botName}
✯ 🌐 Prefix: ${botPrefix}
✯ 👨‍💻 Developer: ${developer}
✯ 🧩 Version: ${version}
✯ 📦 Commands Loaded: ${commandCount}
✯ ⏱️ Uptime: ${uptimeFormatted}
◈━━━━━━━━━━━━━━━━━━━━◈

Thank you for using NovaBot!`;

        api.sendMessage(infoMessage, threadID);
    },
}; 
