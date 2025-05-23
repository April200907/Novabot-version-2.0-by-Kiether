module.exports = {
  name: "unsend",
  version: "1.0",
  description: "Unsend bot message by replying to the message.",
  author: "April",
  usePrefix: false,
  admin: false,

  async execute({ api, event }) {
    const { messageReply, threadID, senderID } = event;

    if (!messageReply || messageReply.senderID !== global.botID) {
      return api.sendMessage(
        "⚠️ Please reply to a message sent by the bot that you want to unsend.",
        threadID
      );
    }

    try {
      await api.unsendMessage(messageReply.messageID);
      return api.sendMessage("✅ Message has been unsent.", threadID);
    } catch (err) {
      console.error("Unsend error:", err);
      return api.sendMessage("❌ Failed to unsend the message.", threadID);
    }
  }
};
