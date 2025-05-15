const { Configuration, OpenAIApi } = require("openai");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

// change by your own api key
const configuration = new Configuration({
  apiKey: "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",
});

const openai = new OpenAIApi(configuration);

module.exports = {
  name: "generateimage",
  version: "1.0",
  description: "Generate AI image using prompt",
  usage: "generateimage <prompt>",
  usePrefix: true,
  cooldown: 10,
  admin: false,

  execute: async ({ api, event, args }) => {
    const prompt = args.join(" ");
    const { threadID, messageID } = event;

    if (!prompt) {
      return api.sendMessage(
        "⚠️ Please enter a prompt.\nExample: generateimage a robot eating pizza in space",
        threadID,
        messageID
      );
    }

    try {
      api.sendMessage("🎨 Generating image, please wait...", threadID);

      const response = await openai.createImage({
        prompt,
        n: 1,
        size: "1024x1024",
      });

      const imageUrl = response.data.data[0].url;
      const imgRes = await axios.get(imageUrl, { responseType: "arraybuffer" });

      const imagePath = path.join(__dirname, "generated.jpg");
      fs.writeFileSync(imagePath, imgRes.data);

      api.sendMessage(
        {
          body: `🖼️ Here's your image for: "${prompt}"`,
          attachment: fs.createReadStream(imagePath),
        },
        threadID,
        () => fs.unlinkSync(imagePath)
      );
    } catch (err) {
      console.error("❌ Error generating image:", err.message);
      api.sendMessage("❌ Failed to generate image. Check your API key or your prompt.", threadID);
    }
  },
};
