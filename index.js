const fs = require("fs");
const path = require("path");
const express = require("express");
const login = require("ws3-fca");
const chalk = require("chalk");
const scheduleTasks = require("./custom");

const app = express();
const PORT = process.env.PORT || 5000;

global.commands = new Map();
global.events = new Map();

const log = {
    info: (msg) => console.log(chalk.blue("[INFO]"), msg),
    success: (msg) => console.log(chalk.green("[SUCCESS]"), msg),
    error: (msg) => console.log(chalk.red("[ERROR]"), msg),
    warn: (msg) => console.log(chalk.yellow("[WARN]"), msg),
};

const loadConfig = (filePath) => {
    try {
        if (!fs.existsSync(filePath)) {
            log.error(`Missing ${filePath}!`);
            process.exit(1);
        }
        return JSON.parse(fs.readFileSync(filePath));
    } catch (error) {
        log.error(`Failed to load ${filePath}: ${error.message}`);
        process.exit(1);
    }
};

const config = loadConfig("./config.json");
const appState = loadConfig("./appState.json");
const botPrefix = config.prefix || "/";
const cooldowns = new Map();
const detectedURLs = new Set();

const loadCommands = () => {
    try {
        const files = fs.readdirSync("./cmds").filter(f => f.endsWith(".js"));
        for (const file of files) {
            const cmd = require(`./cmds/${file}`);
            if (cmd.name && cmd.execute) {
                global.commands.set(cmd.name, cmd);
                log.success(`Loaded command: ${cmd.name}`);
            }
        }
    } catch (err) {
        log.error("Failed to load commands: " + err.message);
    }
};

const loadEvents = () => {
    try {
        const files = fs.readdirSync("./events").filter(f => f.endsWith(".js"));
        for (const file of files) {
            const event = require(`./events/${file}`);
            if (event.name && event.execute) {
                global.events.set(event.name, event);
                log.success(`Loaded event: ${event.name}`);
            }
        }
    } catch (err) {
        log.error("Failed to load events: " + err.message);
    }
};

// Web UI
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});
app.listen(PORT, (err) => {
    if (err) return log.error(`Failed to start server: ${err.message}`);
    log.info(`Web server running at http://localhost:${PORT}`);
});

// Bot starter
const startBot = () => {
    if (!appState || Object.keys(appState).length === 0) {
        return log.error("Invalid or missing appState.");
    }

    login({ appState }, (err, api) => {
        if (err) {
            return log.error("Login failed: " + (err.error || err.message));
        }

        api.setOptions(config.option);
        global.api = api;
        global.botID = api.getCurrentUserID(); // <- Bot's UID

        console.clear();
        log.success("Bot is now online!");
        api.sendMessage("🤖 Bot started successfully!", config.ownerID);

        global.events.forEach(evt => {
            if (evt.onStart) evt.onStart(api);
        });

        api.listenMqtt(async (err, event) => {
            if (err) {
                log.error("Event listen error: " + err.message);
                return api.sendMessage("❌ Listening error!", config.ownerID);
            }

            const { body, threadID, senderID, type } = event;

            // Trigger events
            if (global.events.has(type)) {
                try {
                    await global.events.get(type).execute({ api, event });
                } catch (e) {
                    log.error(`Event '${type}' failed: ${e.message}`);
                }
            }

            // URL detection
            const urlRegex = /(https?:\/\/[^\s]+)/gi;
            if (body && urlRegex.test(body)) {
                const urlCommand = global.commands.get("url");
                if (urlCommand) {
                    const url = body.match(urlRegex)[0];
                    const key = `${threadID}-${url}`;
                    if (detectedURLs.has(key)) return;
                    detectedURLs.add(key);
                    try {
                        await urlCommand.execute({ api, event });
                    } catch (err) {
                        log.warn("URL command error: " + err.message);
                    }
                    setTimeout(() => detectedURLs.delete(key), 3600000);
                }
            }

            // Command handling
            if (body) {
                let args = body.trim().split(/ +/);
                let commandName = args.shift().toLowerCase();
                if (body.startsWith(botPrefix)) {
                    commandName = body.slice(botPrefix.length).split(/ +/).shift().toLowerCase();
                }

                const command = global.commands.get(commandName);
                if (!command) return;

                if (command.usePrefix && !body.startsWith(botPrefix)) return;

                if (command.admin && senderID !== config.ownerID) {
                    return api.sendMessage("❌ Only the bot owner can use this command.", threadID);
                }

                const now = Date.now();
                const key = `${senderID}-${command.name}`;
                const cooldown = (command.cooldown || 0) * 1000;
                const last = cooldowns.get(key) || 0;

                if (now - last < cooldown) {
                    const wait = ((cooldown - (now - last)) / 1000).toFixed(1);
                    return api.sendMessage(`⏳ Please wait ${wait}s before using '${command.name}' again.`, threadID);
                }

                try {
                    await command.execute({ api, event, args });
                    cooldowns.set(key, now);
                } catch (err) {
                    log.error(`Command '${command.name}' error: ${err.message}`);
                    api.sendMessage("❌ An error occurred while executing command.", threadID);
                }
            }
        });

        // Scheduled tasks
        scheduleTasks(config.ownerID, api, {
            autoRestart: true,
            autoGreet: true
        });
    });
};

// Load everything
loadEvents();
loadCommands();
startBot();
