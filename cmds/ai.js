const axios = require("axios");

module.exports = {
  name: "ai",
  usePrefix: false,
  usage: "ai <text or reply image>",
  description: "Gemini 2.0 advanced AI with image recognition",
  author: "April Manalo",
  version: "2.0",

  execute: async ({ api, event, args }) => {
    const prompt = args.join(" ").trim();
    const { threadID, messageID, messageReply } = event;
    let imageUrl = null;

    if (!prompt && (!messageReply || !messageReply.attachments?.length)) {
      return api.sendMessage("⚠️ Please provide a prompt or reply to an image.", threadID, messageID);
    }

    if (messageReply && messageReply.attachments?.[0]?.type === "photo") {
      imageUrl = messageReply.attachments[0].url;
    }

    const loading = await api.sendMessage("Processing Gemini AI request...", threadID, messageID);

    try {
      let result = "";

      if (/^(create|draw|generate|imagine|drawing)\b/i.test(prompt)) {
        const imgUrl = `https://jonell01-ccprojectsapihshs.hf.space/api/generate-art?prompt=${encodeURIComponent(prompt)}`;
        return api.sendMessage({ body: "Here is your generated image:", attachment: await global.utils.getStreamFromURL(imgUrl) }, threadID, loading.messageID);
      }

      if (imageUrl) {
        const response = await axios.get("https://api.zetsu.xyz/api/gemini", {
          params: { prompt, url: imageUrl, apikey: process.env.ZETSU_API_KEY || "YOUR_API_KEY" }
        });
        result = response.data.gemini || "⚠️ No result from image analysis.";
      } else {
        const response = await axios.get("https://hazeyyyy-rest-apis.onrender.com/api/gemini", {
          params: { question: prompt }
        });
        result = response.data.gemini || response.data.result || "⚠️ No result from text analysis.";
      }

      const msg = `✦ 𝗚𝗲𝗺𝗶𝗻𝗶 𝟮.𝟬 𝗔𝗱𝘃 𝗩𝗶𝘀𝗶𝗼𝗻:\n\n${convertToBold(result)}`;
      return api.sendMessage(msg, threadID, loading.messageID);

    } catch (err) {
      console.error("Gemini AI Error:", err.message || err);
      return api.sendMessage("❌ Error contacting Gemini API.", threadID, loading.messageID);
    }
  }
};
