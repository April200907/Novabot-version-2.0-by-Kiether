module.exports = {
  name: "leavegc",
  version: "1.0",
  description: "Leave a group from the list of joined groups.",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    try {
      // Fetch all threads
      let threads = [];
      let timestamp = null;
      let batch = [];

      do {
        batch = await api.getThreadList(20, timestamp, null);
        threads = threads.concat(batch);
        if (batch.length > 0) {
          timestamp = batch[batch.length - 1].timestamp;
        }
      } while (batch.length > 0);

      // Include all group threads, even those with no name
      const groups = threads.filter(t => t.isGroup && t.threadID);

      if (!args[0]) {
        if (groups.length === 0) {
          return api.sendMessage("⚠️ No group chats found.", threadID, messageID);
        }

        const list = groups
          .map((g, i) => `${i + 1}. ${g.name || "Unnamed Group"} (${g.threadID})`)
          .join("\n");

        return api.sendMessage(
          `📋 Group Chats Joined:\n\n${list}\n\nReply with:\nleavegc <number>\nto leave a group.`,
          threadID,
          messageID
        );
      }

      const index = parseInt(args[0]) - 1;
      if (isNaN(index) || index < 0 || index >= groups.length) {
        return api.sendMessage("⚠️ Invalid group number.", threadID, messageID);
      }

      const targetGroup = groups[index];

      await api.removeUserFromGroup(global.botID, targetGroup.threadID);

      api.sendMessage(`✅ Successfully left the group "${targetGroup.name || "Unnamed Group"}".`, threadID, messageID);
    } catch (err) {
      console.error("LeaveGC Error:", err);
      api.sendMessage("❌ Failed to leave the group. The bot may not have permission or isn't in the group.", threadID, messageID);
    }
  }
};
