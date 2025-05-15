const fs = require("fs");
const path = require("path");
const filePath = path.join(__dirname, "bannedwords.json");

if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, "{}");
let bannedData = JSON.parse(fs.readFileSync(filePath));

module.exports = {
    name: "bannedwords",
    usePrefix: true,
    usage: "bannedwords add/remove/on/off/list | unwarn @mention",
    version: "2.0",
    description: "Manages banned words and warnings in group chat.",
    cooldown: 3,
    admin: true,

    execute: async ({ api, event, args }) => {
        const { threadID, messageID, mentions, senderID } = event;
        const action = args[0]?.toLowerCase();
        const word = args.slice(1).join(" ")?.toLowerCase();

        // Init thread data if not present
        if (!bannedData[threadID]) {
            bannedData[threadID] = {
                active: false,
                words: [],
                warnings: {} // userID: count
            };
        }

        const threadData = bannedData[threadID];

        // ADD word
        if (action === "add") {
            if (!word) return api.sendMessage("❌ Please specify a word to add.", threadID, messageID);
            if (threadData.words.includes(word)) return api.sendMessage("⚠️ Word already exists.", threadID, messageID);
            threadData.words.push(word);
            saveData();
            return api.sendMessage(`✅ Added banned word: "${word}"`, threadID, messageID);

        // REMOVE word
        } else if (action === "remove") {
            if (!word) return api.sendMessage("❌ Please specify a word to remove.", threadID, messageID);
            threadData.words = threadData.words.filter(w => w !== word);
            saveData();
            return api.sendMessage(`✅ Removed banned word: "${word}"`, threadID, messageID);

        // ON/OFF
        } else if (action === "on") {
            threadData.active = true;
            saveData();
            return api.sendMessage("✅ Banned words filter is now ON.", threadID, messageID);

        } else if (action === "off") {
            threadData.active = false;
            saveData();
            return api.sendMessage("❌ Banned words filter is now OFF.", threadID, messageID);

        // LIST
        } else if (action === "list") {
            const list = threadData.words;
            if (!list.length) return api.sendMessage("ℹ️ No banned words set.", threadID, messageID);
            return api.sendMessage(
`◈━Banned Word List━◈
${list.map((w, i) => `✯ ${i + 1}. ${w}`).join("\n")}
◈━━━━━━━━━━━━━◈`,
                threadID
            );

        // UNWARN
        } else if (action === "unwarn") {
            const mentionIDs = Object.keys(mentions);
            if (!mentionIDs.length) return api.sendMessage("❌ Please mention a user to unwarn.", threadID, messageID);
            const target = mentionIDs[0];
            if (!threadData.warnings[target]) return api.sendMessage("ℹ️ That user has no warnings.", threadID, messageID);
            threadData.warnings[target] = Math.max(0, threadData.warnings[target] - 1);
            saveData();
            return api.sendMessage(`✅ Warning removed. Total warnings: ${threadData.warnings[target]}`, threadID, messageID);

        } else {
            return api.sendMessage("⚠️ Usage:\n• bannedwords add/remove/on/off/list\n• bannedwords unwarn @mention", threadID, messageID);
        }
    },

    onMessage: ({ api, event }) => {
        const { threadID, senderID, body } = event;

        if (!body || !bannedData[threadID] || !bannedData[threadID].active) return;
        const threadData = bannedData[threadID];
        const badWords = threadData.words;

        const messageLower = body.toLowerCase();
        const matched = badWords.find(word => messageLower.includes(word));
        if (!matched) return;

        if (!threadData.warnings[senderID]) threadData.warnings[senderID] = 1;
        else threadData.warnings[senderID]++;

        const warnCount = threadData.warnings[senderID];

        if (warnCount >= 3) {
            api.removeUserFromGroup(senderID, threadID, err => {
                if (err) return api.sendMessage("❌ Failed to kick user.", threadID);
                api.sendMessage(`⛔ ${warnCount} warnings reached. User has been removed.`, threadID);
                delete threadData.warnings[senderID];
                saveData();
            });
        } else {
            saveData();
            api.sendMessage(`⚠️ Warning ${warnCount}/3: Banned word detected.`, threadID);
        }
    }
};

// Helper to save the data
function saveData() {
    fs.writeFileSync(filePath, JSON.stringify(bannedData, null, 2));
                     }
