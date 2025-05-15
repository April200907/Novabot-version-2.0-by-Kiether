const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
  name: "adc",
  usePrefix: false,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage("❗ Usage: adc <commandName>", threadID, messageID);
    }

    const commandName = args[0].toLowerCase();
    const filePath = path.join(__dirname, `${commandName}.js`);

    if (!fs.existsSync(filePath)) {
      return api.sendMessage(`❌ Command file '${commandName}.js' not found.`, threadID, messageID);
    }

    try {
      const content = fs.readFileSync(filePath, "utf8");

      const response = await axios.post("https://hastebin.com/documents", content, {
        headers: { "Content-Type": "text/plain" }
      });

      const key = response.data.key;
      const url = `https://hastebin.com/raw/${key}`;

      api.sendMessage(`📤 Uploaded '${commandName}.js':\n${url}`, threadID, messageID);
    } catch (err) {
      console.error("adc.js error:", err);
      api.sendMessage("❌ Failed to upload file to pastebin-like service.", threadID, messageID);
    }
  }
};
