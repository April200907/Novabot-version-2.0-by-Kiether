// Function to start the bot
const startBot = () => {
    if (!appState || Object.keys(appState).length === 0) {
        return log.error("Invalid or missing appState. Please make sure appState.json is loaded correctly.");
    }

    login({ appState }, (err, api) => {
        if (err) {
            return log.error("Login failed: " + (err.error || err.message));
        }

        api.setOptions(config.option);
        global.api = api;
        global.botID = api.getCurrentUserID(); // <-- This is the important line

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

            if (global.events.has(type)) {
                try {
                    await global.events.get(type).execute({ api, event });
                } catch (e) {
                    log.error(`Event '${type}' failed: ${e.message}`);
                }
            }

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

        scheduleTasks(config.ownerID, api, {
            autoRestart: true,
            autoGreet: true
        });
    });
};
