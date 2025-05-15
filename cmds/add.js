module.exports = {
  name: "add",
  version: "1.0",
  description: "Show groups where bot is active and join one by ID.",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { senderID, threadID, messageID } = event;

    // Get all group threads
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup && t.name);

    // If no argument: show group list
    if (!args[0]) {
      if (groups.length === 0) {
        return api.sendMessage("⚠️ No active group chats found.", threadID, messageID);
      }

      const list = groups
        .map((group, index) => `${index + 1}. ${group.name} (${group.threadID})`)
        .join("\n");

      return api.sendMessage(
        `📋 Active Group List:\n\n${list}\n\nReply with:\nadd <number>\nto be added to a group.`,
        threadID,
        messageID
      );
    }

    // If argument is a number, add sender to group
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= groups.length) {
      return api.sendMessage("⚠️ Invalid group number.", threadID, messageID);
    }

    const targetGroup = groups[index];
    api.addUserToGroup(senderID, targetGroup.threadID, (err) => {
      if (err) {
        return api.sendMessage("❌ Failed to add you. Maybe you're already a member or the group is full.", threadID, messageID);
      }

      api.sendMessage(`✅ You've been added to "${targetGroup.name}".`, threadID, messageID);
    });
  }
};
