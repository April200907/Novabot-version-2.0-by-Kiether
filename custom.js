const cron = require("node-cron");

const scheduleTasks = (ownerID, api, config = { autoRestart: true, autoGreet: true }) => {
    console.log("⚙️ Scheduler active: Restart and Greeting tasks enabled.");

    // 🔁 Auto-Restart Schedule — 4 times daily
    if (config.autoRestart) {
        const restartTimes = ["0 6 * * *", "0 12 * * *", "0 18 * * *", "0 0 * * *"];

        restartTimes.forEach(time => {
            cron.schedule(time, () => {
                api.sendMessage("♻️ Auto restart initiated to maintain performance.", ownerID, () => {
                    console.log(`♻️ Restart executed at: ${time}`);
                    process.exit(1); // For Replit: Requires uptime monitor like UptimeRobot to restart properly
                });
            }, { timezone: "Asia/Manila" });
        });

        console.log("✅ Auto-restart schedules loaded (6AM | 12PM | 6PM | 12AM).");
    } else {
        console.log("⚠️ Auto-restart is turned off.");
    }

    // ☀️ Auto-Greeting Messages
    if (config.autoGreet) {
        const greetingSchedule = [
            { cronTime: "0 6 * * *", messages: ["☀️ Good morning! Rise and shine, everyone!"] },
            { cronTime: "0 9 * * *", messages: ["⏰ Time check: 9:00 AM! Let’s make today productive!"] },
            { cronTime: "0 12 * * *", messages: ["🍽️ It’s lunchtime! Take a break and enjoy your meal."] },
            { cronTime: "0 15 * * *", messages: ["⏳ Almost the end of the day. Keep going!"] },
            { cronTime: "0 18 * * *", messages: ["🌆 Good evening! Hope your day went well."] },
            { cronTime: "0 22 * * *", messages: ["🌙 Time to rest. Good night and sweet dreams!"] },
        ];

        greetingSchedule.forEach(greet => {
            cron.schedule(greet.cronTime, () => {
                const message = greet.messages.join("\n");
                api.getThreadList(10, null, ["INBOX"], (err, threads) => {
                    if (err) return console.error("❌ Failed to fetch inbox threads:", err);
                    threads.forEach(thread => {
                        api.sendMessage(message, thread.threadID);
                    });
                });
                console.log(`📨 Sent auto-greeting: ${message}`);
            }, { timezone: "Asia/Manila" });
        });

        console.log("✅ Greeting messages scheduled successfully.");
    } else {
        console.log("⚠️ Auto-greeting feature is turned off.");
    }
};

module.exports = scheduleTasks;
