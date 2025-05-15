const fs = require("fs");
const filePath = __dirname + "/../antiout.json";

module.exports = {
  name: "antiout",
  version: "1.0",
  description: "Toggle antiout feature per group.",
  usePrefix: true,
  admin: true,

  execute: async ({ api, event, args }) => {
    const { threadID, messageID } = event;

    let data = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    const current = data[threadID] || false;
    const newState = !current;
    data[threadID] = newState;

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    api.sendMessage(
      `✅ Antiout has been ${newState ? "enabled" : "disabled"} for this group.`,
      threadID,
      messageID
    );
  }
};
