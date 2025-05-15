module.exports = {
  name: "message",
  execute: async ({ api, event }) => {
    const { senderID, body, threadID } = event;
    const { prefix } = require('../config.json'); // to access the bot's prefix

    // Check if the message starts with the bot's prefix
    if (body.startsWith(prefix)) {
      let args = body.slice(prefix.length).trim().split(/ +/);
      let command = args.shift().toLowerCase();

      // Check for the command and execute corresponding logic
      if (command === "ping") {
        // Respond to a "ping" command
        api.sendMessage("Pong! 🏓", threadID);
      } else if (command === "hello") {
        // Respond to a "hello" command
        api.sendMessage("Hello! How can I help you today? 😊", threadID);
      } else {
        // If command is not recognized
        api.sendMessage("Sorry, I don't recognize that command. Type !help for available commands.", threadID);
      }
    }
  }
};
