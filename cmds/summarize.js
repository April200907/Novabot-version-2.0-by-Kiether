const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];
  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }
  return chunks;
}

module.exports = {
  name: "summarize",
  description: "Summarize a paragraph.",
  cooldown: 2,
  usePrefix: false,
  admin: false,

  async execute({ api, event, args }) {
    const text = args.join(" ");
    const senderId = event.senderID;
    const threadID = event.threadID;
    const messageID = event.messageID;

    if (!text) {
      return api.sendMessage(
        "𝗘𝗿𝗿𝗼𝗿: 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝘁𝗲𝘅𝘁 𝘁𝗼 𝘀𝘂𝗺𝗺𝗮𝗿𝗶𝘇𝗲.\n𝗘𝘅𝗮𝗺𝗽𝗹𝗲: /summarizer Love is a powerful emotion...",
        threadID,
        messageID
      );
    }

    try {
      const apiUrl = `https://kaiz-apis.gleeze.com/api/summarizer?text=${encodeURIComponent(text)}`;
      const { data } = await axios.get(apiUrl);

      if (!data.summary) {
        return api.sendMessage("𝗘𝗿𝗿𝗼𝗿: 𝗦𝘂𝗺𝗺𝗮𝗿𝘆 𝗻𝗼𝘁 𝗳𝗼𝘂𝗻𝗱.", threadID, messageID);
      }

      const messages = splitMessageIntoChunks(
        `𝗦𝘂𝗺𝗺𝗮𝗿𝘆:\n${data.summary}\n\n𝗞𝗲𝘆𝘄𝗼𝗿𝗱𝘀:\n${data.keywords?.join(', ') || 'None'}`,
        2000
      );

      for (const msg of messages) {
        await api.sendMessage(msg, threadID);
      }
    } catch (err) {
      console.error("Summarizer error:", err.message);
      api.sendMessage("𝗘𝗿𝗿𝗼𝗿: 𝗖𝗼𝘂𝗹𝗱 𝗻𝗼𝘁 𝗿𝗲𝗮𝗰𝗵 𝘁𝗵𝗲 𝘀𝘂𝗺𝗺𝗮𝗿𝗶𝘇𝗲𝗿 𝗔𝗣𝗜.", threadID, messageID);
    }
  }
};
 
