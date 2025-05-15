module.exports = {
  name: "leavegc",
  version: "1.1",
  description: "Leave a group from the list of joined groups",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    try {
      // Fetch all threads (pagination)
      let threads = [];
      let timestamp = null;
      let batch = [];

      do {
        batch = await api.getThreadList(20, timestamp, ["INBOX"]);
        threads = threads.concat(batch);
        if (batch.length > 0) {
          timestamp = batch[batch.length - 1].timestamp;
        }
      } while (batch.length > 0);

      // Filter valid groups (with name + threadID)
      const groups = threads.filter(t => t.isGroup && t.threadID && t.name);

      if (groups.length === 0) {
        return api.sendMessage("⚠️ No group chats found.", threadID, messageID);
      }

      // Show group list if no argument
      if (!args[0]) {
        const list = groups
          .map((group, index) => `${index + 1}. ${group.name} (${group.threadID})`)
          .join("\n");

        return api.sendMessage(
          `📋 Joined Group List:\n\n${list}\n\nTo leave a group, reply with:\nleavegc <number>`,
          threadID,
          messageID
        );
      }

      // Parse and validate group index
      const index = parseInt(args[0]) - 1;
      if (isNaN(index) || index < 0 || index >= groups.length) {
        return api.sendMessage("⚠️ Invalid group number.", threadID, messageID);
      }

      const targetGroup = groups[index];

      // Safely get bot's own ID (recommended)
      const botID = global.botID || api.getCurrentUserID();

      await api.removeUserFromGroup(botID, targetGroup.threadID);

      return api.sendMessage(`✅ Successfully left the group "${targetGroup.name}".`, threadID, messageID);
    } catch (err) {
      console.error("❌ LeaveGC command error:", err);
      return api.sendMessage("❌ An error occurred while executing the command.", threadID, messageID);
    }
  }
};
