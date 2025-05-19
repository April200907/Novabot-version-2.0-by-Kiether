const axios = require("axios");

module.exports = {
  name: "ai",
  usePrefix: false,
  usage: "ai <your question> | <reply to an image>",
  version: "1.2",
  admin: false,
  author: "April Manalo",
  cooldown: 2,

  execute: async ({ api, event, args }) => {
    try {
      const { threadID, messageReply } = event;
      let prompt = args.join(" ") || "Describe this image";
      let imageUrl = null;

      // If image is replied
      if (messageReply && messageReply.attachments.length > 0) {
        const attachment = messageReply.attachments[0];
        if (attachment.type === "photo") {
          imageUrl = attachment.url;
        }
      }

      const apiUrl = `https://kaiz-apis.gleeze.com/api/gemini-vision?q=${encodeURIComponent(prompt)}&uid=100075247455712&imageUrl=${encodeURIComponent(imageUrl || "")}&apikey=8ac48eba-be21-49d9-8db4-b4db24a7832a`;

      const loadingMsg = await api.sendMessage("Gemini flash 2.0⚡", threadID);
      const response = await axios.get(apiUrl);

      const result = response?.data?.data;

      if (result) {
        return api.sendMessage(`◈━Gemini Flash 2.0━◈\n✯ ${result}\n◈━━━━━━━━━━━━◈`, threadID, loadingMsg.messageID);
      }

      return api.sendMessage("⚠️ Walang description na nakuha sa API response.", threadID, loadingMsg.messageID);
    } catch (error) {
      console.error("❌ Gemini Error:", error);
      return api.sendMessage("❌ Error while contacting Gemini API.", event.threadID);
    }
  }
};
