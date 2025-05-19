module.exports = {
  name: "accept",
  version: "1.0",
  author:"April Manalo", 
  admin: true, 
  usePrefix: false, 
  description: "Accept a pending message or group chat by number",
  role: 0,
  async execute({ api, event, args }) {
    if (!global.pendingList || global.pendingList.length === 0) {
      return api.sendMessage("You don't have a list of pending requests. Use the `pending` command first.", event.threadID, event.messageID);
    }

    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || !global.pendingList[index]) {
      return api.sendMessage("Invalid number. Check the list using the `pending` command.", event.threadID, event.messageID);
    }

    const threadID = global.pendingList[index];

    try {
      await api.handleMessageRequest(threadID);
      return api.sendMessage(`Successfully accepted request number ${index + 1}.`, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("An error occurred while accepting the request.", event.threadID, event.messageID);
    }
  }
};
