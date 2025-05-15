const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
    name: "shoti",
    usePrefix: false,
    usage: "shoti",
    version: "1.0",
    cooldown: 5,
    admin: false,

    execute: async ({ api, event }) => {
        const { threadID, messageID } = event;

        const safeReact = (emoji) => {
            if (typeof api.setMessageReaction === "function" && messageID) {
                api.setMessageReaction(emoji, messageID, () => {}, true);
            } else {
                console.warn("⚠️ Cannot set reaction.");
            }
        };

        try {
            safeReact("⏳");

            const response = await axios.get("https://apis-rho-nine.vercel.app/tikrandom");
            const data = response.data;

            console.log("📜 API Response:", data);

            if (!data || !data.playUrl) {
                safeReact("❌");
                return api.sendMessage("⚠️ No video URL received from API.", threadID, messageID);
            }

            const videoUrl = data.playUrl;
            const title = data.desc || "Random TikTok Clip";
            const filePath = path.join(__dirname, "tikrandom.mp4");

            const writer = fs.createWriteStream(filePath);
            const videoStream = await axios({
                url: videoUrl,
                method: "GET",
                responseType: "stream",
            });

            videoStream.data.pipe(writer);

            writer.on("finish", () => {
                safeReact("✅");

                const msg = {
                    body: `📺 Here's your shoti video!\n📝 Title: ${title}`,
                    attachment: fs.createReadStream(filePath),
                };

                api.sendMessage(msg, threadID, (err) => {
                    if (err) {
                        console.error("❌ Error sending video:", err);
                        api.sendMessage("⚠️ Failed to send video.", threadID);
                    }

                    fs.unlink(filePath, (unlinkErr) => {
                        if (unlinkErr) console.error("❌ Error deleting file:", unlinkErr);
                    });
                });
            });

            writer.on("error", (err) => {
                console.error("❌ Error writing video:", err);
                safeReact("❌");
                api.sendMessage("⚠️ Failed to save video file.", threadID, messageID);
            });

        } catch (error) {
            console.error("❌ Error fetching video:", error);
            safeReact("❌");
            api.sendMessage(`⚠️ Could not fetch the video. Error: ${error.message}`, threadID, messageID);
        }
    },
};
