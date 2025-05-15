module.exports = {
  name: "ping", 
  description: "Replies with Pong!", 
  usage: "!ping", 
  version: "1.0", 
  execute: async ({ api, event, args }) => {
    const { threadID } = event;
    api.sendMessage("Pong! 🏓", threadID);
  }
};
