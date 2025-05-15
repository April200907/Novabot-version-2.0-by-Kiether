const { exec } = require("child_process");

module.exports = {
  name: "restart",
  usage: "/restart",
  version: "1.0.0",
  description: "Restarts the bot",
  admin:true, 
  usePrefix: true,
  execute: async ({ api, event }) => {
    const isAdmin = ["100075247455712"].includes(event.senderID); // Replace with your admin ID
    if (!isAdmin) {
      return api.sendMessage("❌ You do not have permission to restart the bot.", event.threadID);
    }

    api.sendMessage("🔄 Restarting the bot...", event.threadID, () => {
      exec("pm2 restart 0 || node index.js", (err, stdout, stderr) => {
        if (err) {
          console.error("❌ Failed to restart the bot:", err);
        }
      });

      // Delay to ensure message gets sent
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }
};
