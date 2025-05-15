module.exports = {
  name: "add",
  version: "1.1",
  description: "Show groups where bot is active and join one by ID.",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { senderID, threadID, messageID } = event;

    // Get all group threads (limit to 100)
    const threads = await api.getThreadList(100, null, ["INBOX"]);
    const groups = threads.filter(t => t.isGroup);

    if (groups.length === 0) {
      return api.sendMessage("⚠️ No active group chats found.", threadID, messageID);
    }

    // If no argument: show group list
    if (!args[0]) {
      const list = groups
        .map((group, index) => {
          const groupName = group.name?.trim() || `Unnamed Group`;
          return `${index + 1}. ${groupName} (${group.threadID})`;
        })
        .join("\n");

      return api.sendMessage(
        `📋 Active Group List:\n\n${list}\n\nReply with:\nadd <number>\nto be added to a group.`,
        threadID,
        messageID
      );
    }

    // Add user to selected group by index
    const index = parseInt(args[0]) - 1;
    if (isNaN(index) || index < 0 || index >= groups.length) {
      return api.sendMessage("⚠️ Invalid group number.", threadID, messageID);
    }

    const targetGroup = groups[index];
    const targetName = targetGroup.name?.trim() || "Unnamed Group";

    api.addUserToGroup(senderID, targetGroup.threadID, (err) => {
      if (err) {
        return api.sendMessage(
          "❌ Failed to add you. You might already be a member or the group is full.",
          threadID,
          messageID
        );
      }

      api.sendMessage(`✅ You've been added to "${targetName}".`, threadID, messageID);
    });
  }
};
