module.exports = {
  name: 'unsend',
  description: 'Unsend the replied message.',
  author:'April', 
  usePrefix: false, 
  admin:false, 
  async execute(event, api) {
    const { messageReply, threadID, senderID } = event;

    if (!messageReply || !messageReply.messageID) {
      return api.sendMessage(
        '❌: 𝗥𝗲𝗽𝗹𝘆 𝘁𝗼 𝗮 𝗺𝗲𝘀𝘀𝗮𝗴𝗲 𝘆𝗼𝘂 𝘄𝗮𝗻𝘁 𝘁𝗼 𝘂𝗻𝘀𝗲𝗻𝗱.',
        threadID,
        senderID
      );
    }

    try {
      await api.unsendMessage(messageReply.messageID);
      api.sendMessage('✅: 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 𝘀𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆 𝘂𝗻𝘀𝗲𝗻𝘁!', threadID);
    } catch (err) {
      console.error('Unsend Error:', err);
      api.sendMessage('❌: 𝗙𝗮𝗶𝗹𝗲𝗱 𝘁𝗼 𝘂𝗻𝘀𝗲𝗻𝗱 𝘁𝗵𝗲 𝗺𝗲𝘀𝘀𝗮𝗴𝗲.', threadID);
    }
  }
};
