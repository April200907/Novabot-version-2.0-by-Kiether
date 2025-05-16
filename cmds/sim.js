const fs = require("fs");
const path = require("path");

const DAN_PATH = path.join(__dirname, "..", "cache", "DAN", "dan.json");

module.exports = {
  name: "sim",
  description: "Chat with sim! ",
  cooldown: 2,
  usePrefix: false,
  admin: false,

  execute: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const input = args.join(" ").toLowerCase();
    if (!input) return api.sendMessage("Sabihin mo kung anong gusto mong pag-usapan.", threadID, messageID);

    let data;
    try {
      data = JSON.parse(fs.readFileSync(DAN_PATH, "utf-8"));
    } catch (err) {
      return api.sendMessage("❌ Can't upload from AI memory file.", threadID, messageID);
    }

    let response;

    // Admin-controlled ADD switch
    if (input.startsWith("add = ")) {
      const mode = input.slice(6).trim();
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ You are not authorized to use add function.", threadID, messageID);
      }

      global.config.ADD_FUNCTION = mode === "on";
      return api.sendMessage(`Add function is now ${mode.toUpperCase()}.`, threadID, messageID);
    }

    // Admin-controlled DELETE switch
    if (input.startsWith("del = ")) {
      const mode = input.slice(6).trim();
      if (!global.config.ADMINBOT.includes(senderID)) {
        return api.sendMessage("❌ You are not authorized to use delete function.", threadID, messageID);
      }

      global.config.DEL_FUNCTION = mode === "on";
      return api.sendMessage(`Delete function is now ${mode.toUpperCase()}.`, threadID, messageID);
    }

    // Delete response format: trigger =! response
    if (input.includes("=!")) {
      if (!global.config.DEL_FUNCTION) return api.sendMessage("❌ Delete function is deactivated.", threadID, messageID);

      const [trigger, resp] = input.split("=!");
      const key = trigger.trim();
      const val = resp?.trim();

      if (!data[key]) return api.sendMessage(`Walang nakatalang sagot para sa "${key}".`, threadID, messageID);

      if (val) {
        const index = data[key].indexOf(val);
        if (index !== -1) {
          data[key].splice(index, 1);
          if (data[key].length === 0) delete data[key];
        }
        response = `✅ Response successfully removed"${val}" sa "${key}".`;
      } else {
        delete data[key];
        response = `✅ All response are successfully removed for"${key}".`;
      }

      fs.writeFileSync(DAN_PATH, JSON.stringify(data, null, 2));
      return api.sendMessage(response, threadID, messageID);
    }

    // Add response format: trigger => response
    if (input.includes("=>")) {
      if (!global.config.ADD_FUNCTION) return api.sendMessage("❌ Add function is deactivated.", threadID, messageID);

      const [trigger, ...rest] = input.split("=>");
      const key = trigger.trim();
      const val = rest.join("=>").trim();

      if (!key || !val) return api.sendMessage("⚠️ Wrong format. Use this format: question => answer", threadID, messageID);

      if (!data[key]) data[key] = [];
      if (!data[key].includes(val)) data[key].push(val);

      fs.writeFileSync(DAN_PATH, JSON.stringify(data, null, 2));
      return api.sendMessage(`✅ Response successfully added"${key}".`, threadID, messageID);
    }

    // Get response
    if (data[input]) {
      const variants = data[input];
      response = variants[Math.floor(Math.random() * variants.length)];
    } else {
      response = "ℹ️ I don't have any response for that. Can you teach me how using this format: question => answer";
    }

    return api.sendMessage(response, threadID, messageID);
  }
};
