const fs = require("fs");
const filePath = __dirname + "/../antiout.json";

module.exports = {
  config: {
    name: "antiout",
    type: "event"
  },

  run: async ({ api, event }) => {
    const { logMessageType, logMessageData, threadID } = event;
    const leftUserID = logMessageData?.leftParticipantFbId;
    const botID = api.getCurrentUserID();

    if (logMessageType !== "log:unsubscribe" || leftUserID === botID) return;

    // Load toggled data
    let data = {};
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    // Check if antiout is ON for this group
    if (data[threadID] !== true) return;

    try {
      await api.addUserToGroup(leftUserID, threadID);
      api.sendMessage(`⚠️ Antiout active! Re-added the user.`, threadID);
    } catch (err) {
      api.sendMessage(`❌ Couldn't re-add user. Bot might not be admin.`, threadID);
    }
  }
};
