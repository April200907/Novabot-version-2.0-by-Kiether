const fs = require("fs");
const path = require("path");

const DAN_PATH = path.join(__dirname, "..", "cache", "DAN", "dan_25mb.json");

module.exports = {
  name: "sim",
  description: "Talk with the bot!",
  cooldown: 2,
  usePrefix: false,
  admin: false,

  execute: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const input = args.join(" ").toLowerCase();
    if (!input) return api.sendMessage("Say something you want to talk about.", threadID, messageID);

    // Make sure DAN file exists
    if (!fs.existsSync(DAN_PATH)) {
      fs.mkdirSync(path.dirname(DAN_PATH), { recursive: true });
      fs.writeFileSync(DAN_PATH, JSON.stringify({}, null, 2));
    }

    let data;
    try {
      data = JSON.parse(fs.readFileSync(DAN_PATH, "utf-8"));
    } catch (err) {
      return api.sendMessage("❌ Failed to load AI memory file.", threadID, messageID);
    }

    let response;

    // Admin: Toggle add function
    if (input.startsWith("add = ")) {
      const mode = input.slice(6).trim();
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ You are not authorized to use the add function.", threadID, messageID);
      }

      global.config.ADD_FUNCTION = mode === "on";
      return api.sendMessage(`Add function is now ${mode.toUpperCase()}.`, threadID, messageID);
    }

    // Admin: Toggle delete function
    if (input.startsWith("del = ")) {
      const mode = input.slice(6).trim();
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ You are not authorized to use the delete function.", threadID, messageID);
      }

      global.config.DEL_FUNCTION = mode === "on";
      return api.sendMessage(`Delete function is now ${mode.toUpperCase()}.`, threadID, messageID);
    }

    // Delete response: trigger =! response
    if (input.includes("=!")) {
      if (!global.config.DEL_FUNCTION) return api.sendMessage("❌ Delete function is disabled.", threadID, messageID);

      const [trigger, resp] = input.split("=!");
      const key = trigger.trim();
      const val = resp?.trim();

      if (!data[key]) return api.sendMessage(`No response found for "${key}".`, threadID, messageID);

      if (val) {
        const index = data[key].indexOf(val);
        if (index !== -1) {
          data[key].splice(index, 1);
          if (data[key].length === 0) delete data[key];
        }
        response = `✅ Removed response "${val}" from "${key}".`;
      } else {
        delete data[key];
        response = `✅ Removed all responses for "${key}".`;
      }

      fs.writeFileSync(DAN_PATH, JSON.stringify(data, null, 2));
      return api.sendMessage(response, threadID, messageID);
    }

    // Add new response: trigger => response
    if (input.includes("=>")) {
      if (!global.config.ADD_FUNCTION) return api.sendMessage("❌ Add function is disabled.", threadID, messageID);

      const [trigger, ...rest] = input.split("=>");
      const key = trigger.trim();
      const val = rest.join("=>").trim();

      if (!key || !val) return api.sendMessage("⚠️ Format error. Use: question => answer", threadID, messageID);

      if (!data[key]) data[key] = [];
      if (!data[key].includes(val)) data[key].push(val);

      fs.writeFileSync(DAN_PATH, JSON.stringify(data, null, 2));
      return api.sendMessage(`✅ New response added to "${key}".`, threadID, messageID);
    }

    // Normal response
    if (data[input]) {
      const variants = data[input];
      response = variants[Math.floor(Math.random() * variants.length)];
    } else {
      response = "ℹ️ I don't have a response for that. You can teach me using: question => answer";
    }

    return api.sendMessage(response, threadID, messageID);
  }
};
