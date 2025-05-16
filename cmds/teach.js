const fs = require("fs");
const path = require("path");

const DAN_PATH = path.join(__dirname, "..", "cache", "DAN", "dan.json");

module.exports = {
  name: "teach",
  description: "Teach the bot how to respond.",
  cooldown: 3,
  usePrefix: false,
  admin: false,

  execute: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const input = args.join(" ").toLowerCase();
    if (!input) return api.sendMessage("Use format:\n- question => answer\n- question =! answer or just question =! to delete all", threadID, messageID);

    let data;
    try {
      data = JSON.parse(fs.readFileSync(DAN_PATH, "utf-8"));
    } catch (err) {
      return api.sendMessage("❌ Error reading memory file.", threadID, messageID);
    }

    // Add new response
    if (input.includes("=>")) {
      if (!global.config.ADD_FUNCTION) return api.sendMessage("❌ Adding is disabled.", threadID, messageID);

      const [trigger, ...rest] = input.split("=>");
      const key = trigger.trim();
      const val = rest.join("=>").trim();

      if (!key || !val) return api.sendMessage("⚠️ Format: question => answer", threadID, messageID);

      if (!data[key]) data[key] = [];
      if (!data[key].includes(val)) data[key].push(val);

      fs.writeFileSync(DAN_PATH, JSON.stringify(data, null, 2));
      return api.sendMessage(`✅ Added response to "${key}".`, threadID, messageID);
    }

    // Delete response
    if (input.includes("=!")) {
      if (!global.config.DEL_FUNCTION) return api.sendMessage("❌ Deletion is disabled.", threadID, messageID);

      const [trigger, resp] = input.split("=!");
      const key = trigger.trim();
      const val = resp?.trim();

      if (!data[key]) return api.sendMessage(`No entry for "${key}".`, threadID, messageID);

      if (val) {
        const index = data[key].indexOf(val);
        if (index !== -1) {
          data[key].splice(index, 1);
          if (data[key].length === 0) delete data[key];
        }
        return api.sendMessage(`✅ Removed response "${val}" from "${key}".`, threadID, messageID);
      } else {
        delete data[key];
        return api.sendMessage(`✅ Removed all responses for "${key}".`, threadID, messageID);
      }
    }

    return api.sendMessage("❗ Invalid format. Use => to add or =! to delete.", threadID, messageID);
  }
};
