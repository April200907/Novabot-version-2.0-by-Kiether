module.exports = {
  name: "leavegc",
  version: "1.0",
  description: "Leave a group from the list of joined groups",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { senderID, threadID, messageID } = event;

    // Fetch all threads with pagination
    let threads = [];
    let timestamp = null;
    let batch;

    do {
      batch = await api.getThreadList(20, timestamp, null);
      threads = threads.concat(batch);
      if (batch.length > 0) {
        timestamp = batch[batch.length - 1].timestamp;
      }
    } while (batch.length > 0);

    const groups = threads.filter(t => t.isGroup && t.threadID && t.name);

    if (groups.length === 0) {
      return api.sendMessage("⚠️ No group chats found.", threadID, messageID);
    }

    // If no args, show list
    if (!args[0]) {
      const list = groups
        .map((group, index) => `${index + 1}. ${group.name} (${group.threadID})`)
        .join("\n");

      return api.sendMessage(
        `📋 Joined Group List:\n\n${list}\n\nReply with:\nleavegc <number>\nto leave a group.`,
        threadID,
        messageID
      );
    }

    // Parse number
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= groups.length) {
      return api.sendMessage("⚠️ Invalid group number.", threadID, messageID);
    }

    const targetGroup = groups[index];

    try {
      await api.removeUserFromGroup(api.getCurrentUserID(), targetGroup.threadID);
      api.sendMessage(`✅ Successfully left the group "${targetGroup.name}".`, threadID, messageID);
    } catch (err) {
      console.error("Leave group error:", err);
      api.sendMessage("❌ Failed to leave the group. Maybe the bot isn't a member or lacks permission.", threadID, messageID);
    }
  }
};
