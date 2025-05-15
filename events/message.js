module.exports = {
    name: "message",
    execute: async ({ api, event }) => {
        const allCommands = Array.from(global.commands.values());

        for (const cmd of allCommands) {
            if (typeof cmd.onMessage === "function") {
                try {
                    await cmd.onMessage({ api, event });
                } catch (err) {
                    console.error(`❌ Error in '${cmd.name}' onMessage:`, err);
                }
            }
        }
    }
};
