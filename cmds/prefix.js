const fs = require("fs");
const axios = require("axios");
const path = require("path");
const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath));

module.exports = {
    name: "prefix",
    usePrefix: false,
    usage: "prefix",
    version: "2.0",
    description: "Displays bot info and sends a Shoti video.",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event }) => {
        const { threadID, messageID } = event;
        const botPrefix = config.prefix || "/";
        const botName = config.botName || "My Bot";
        const filePath = path.join(__dirname, "shoti.mp4");

        try {
            // Fetch a random Shoti video
            const response = await axios.get("https://apis-rho-nine.vercel.app/tikrandom");
            if (!response.data || !response.data.playUrl) {
                return api.sendMessage("⚠️ Failed to get video from Shoti API.", threadID, messageID);
            }

            const videoUrl = response.data.playUrl;

            const videoResponse = await axios({
                url: videoUrl,
                method: "GET",
                responseType: "stream",
            });

            const writer = fs.createWriteStream(filePath);
            videoResponse.data.pipe(writer);

            writer.on("finish", () => {
                api.sendMessage({
                    body:
`◈━Bot Information━◈
✯ Prefix: ${botPrefix}
✯ Bot Name: ${botName}
✯ Developer: April Macasinag Manalo
✯ Version: NovaBot 2.0
◈━━━━━━━━━━━━◈

Here's your shoti video!`,
                    attachment: fs.createReadStream(filePath),
                }, threadID, () => {
                    fs.unlink(filePath, (err) => {
                        if (err) console.error("Failed to delete video:", err);
                    });
                });
            });

            writer.on("error", (err) => {
                console.error("Error saving video:", err);
                api.sendMessage("⚠️ Failed to download Shoti video.", threadID, messageID);
            });

        } catch (error) {
            console.error("Error:", error.message);
            api.sendMessage("⚠️ Could not fetch video from Shoti API.", threadID, messageID);
        }
    },
};
