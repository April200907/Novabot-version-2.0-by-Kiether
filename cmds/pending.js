module.exports = {
  name: "pending",
  version:"1.0", 
  author:"April", 
  description: "View all pending message and group chat requests",
  admin:true,
  usePrefix: false, 
  role: 0,
  async execute({ api, event }) {
    try {
      const threads = await api.getThreadList(20, null, ["OTHER"]); // 'OTHER' = pending
      if (threads.length === 0) {
        return api.sendMessage("There are no pending message or group chat requests.", event.threadID, event.messageID);
      }

      let msg = "Pending Messages:\n\n";
      global.pendingList = [];

      threads.forEach((thread, index) => {
        const name = thread.name || thread.nicknames?.[thread.participantIDs[0]] || "Unknown";
        msg += `${index + 1}. ${name}${thread.isGroup ? " (Group Chat)" : ""}\n`;
        global.pendingList.push(thread.threadID);
      });

      msg += "\nTo accept a request, use:\naccept <number>";
      return api.sendMessage(msg, event.threadID, event.messageID);
    } catch (err) {
      console.error(err);
      return api.sendMessage("An error occurred while fetching pending messages.", event.threadID, event.messageID);
    }
  }
};
