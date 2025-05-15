const fs = require("fs");
const path = require("path");
const axios = require("axios");

module.exports = {
    name: "changeavatar",
    version: "1.0",
    usage: "changeavatar <image_url> OR reply to an image with 'changeavatar'",
    description: "Change the bot's profile picture using an image URL or a replied image.",
    usePrefix: true,
    cooldown: 5,
    admin: true,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, senderID } = event;
        let imageUrl;

        // Get image from reply or argument
        if (event.messageReply && event.messageReply.attachments.length > 0) {
            const attachment = event.messageReply.attachments[0];
            if (attachment.type !== "photo") {
                return api.sendMessage("⚠️ Please reply to an image file.", threadID, messageID);
            }
            imageUrl = attachment.url;
        } else if (args.length > 0) {
            imageUrl = args[0];
        } else {
            return api.sendMessage(
                "⚠️ Provide an image URL or reply to an image.\n📌 Usage: changeavatar <image_url>",
                threadID,
                messageID
            );
        }

        // Ask for confirmation via reaction
        api.sendMessage(
            "⚠️ Are you sure to change the Facebook profile?\nPlease react to this message to continue.",
            threadID,
            async (err, info) => {
                if (err) return console.error("❌ Error sending confirm message:", err);
                const confirmMsgID = info.messageID;

                const handleReaction = async (reactionEvent) => {
                    if (
                        reactionEvent.messageID === confirmMsgID &&
                        reactionEvent.userID === senderID
                    ) {
                        // Set checkmark reaction
                        api.setMessageReaction("✅", confirmMsgID, () => {}, true);
                        // Remove handler
                        global.reactEvents = global.reactEvents.filter(fn => fn !== handleReaction);

                        try {
                            // Try downloading and saving the image
                            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
                            const imagePath = path.join(__dirname, "avatar.jpg");
                            fs.writeFileSync(imagePath, response.data);

                            const imageStream = fs.createReadStream(imagePath);
                            api.changeAvatar(imageStream, "", null, (err) => {
                                fs.unlinkSync(imagePath);

                                if (err) {
                                    console.error("❌ Error changing avatar:", err);
                                    return api.sendMessage("❌ Failed to change the avatar.", threadID);
                                }

                                api.sendMessage("✅ Bot avatar changed successfully!", threadID);
                            });

                            // Auto-unsend confirmation message
                            api.unsendMessage(confirmMsgID, (err) => {
                                if (err) console.error("❌ Failed to unsend confirm message:", err);
                            });
                        } catch (error) {
                            console.error("❌ Error downloading image:", error);
                            api.sendMessage(
                                "❌ Couldn't download the image. Make sure it's a valid URL or reply to an image.",
                                threadID
                            );
                        }
                    }
                };

                global.reactEvents.push(handleReaction);
            }
        );
    },
};