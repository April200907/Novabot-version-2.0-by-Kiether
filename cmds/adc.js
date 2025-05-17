const fs = require("fs");
const axios = require("axios");
const request = require("request");
const cheerio = require("cheerio");
const { resolve } = require("path");
const { PasteClient } = require("pastebin-api");

module.exports = {
    name: "adc",
    version: "1.0.0",
    description: "Apply code from buildtooldev, pastebin, or GDrive",
    commandCategory: "admin",
    usages: "[reply to link or provide file name]",
    cooldown: 0,
    admin: true,
    dependencies: {
        "pastebin-api": "",
        "cheerio": "",
        "request": ""
    },

    execute: async function ({ api, event, args }) {
        const { threadID, messageID, messageReply, type } = event;
        let text = args[0];

        if (type === "message_reply") {
            text = messageReply.body;
        }

        if (!text && !args[0]) {
            return api.sendMessage("❗ Please reply with a link or provide a file name.", threadID, messageID);
        }

        // If file name only (no link) → Upload local file to Pastebin
        if (!text && args[0]) {
            const filePath = `${__dirname}/${args[0]}.js`;
            if (!fs.existsSync(filePath)) {
                return api.sendMessage(`❌ Command ${args[0]}.js does not exist.`, threadID, messageID);
            }
            const data = fs.readFileSync(filePath, "utf-8");
            const client = new PasteClient("R02n6-lNPJqKQCd5VtL4bKPjuK6ARhHb");
            try {
                const url = await client.createPaste({
                    code: data,
                    expireDate: "N",
                    format: "javascript",
                    name: args[1] || "noname",
                    publicity: 1
                });
                const id = url.split("/")[3];
                return api.sendMessage(`Here is your paste: https://pastebin.com/raw/${id}`, threadID, messageID);
            } catch (e) {
                return api.sendMessage("❌ Failed to upload to Pastebin.", threadID, messageID);
            }
        }

        const urlRegex = /https?:\/\/[^\s]+/;
        const urlMatch = text.match(urlRegex);
        if (!urlMatch) return api.sendMessage("❗ Invalid link.", threadID, messageID);
        const url = urlMatch[0];

        // Handle Pastebin
        if (url.includes("pastebin")) {
            try {
                const res = await axios.get(url);
                fs.writeFileSync(`${__dirname}/${args[0]}.js`, res.data, "utf-8");
                return api.sendMessage(`✅ Applied code to ${args[0]}.js. Use 'load' to activate.`, threadID, messageID);
            } catch (e) {
                return api.sendMessage("❌ Error downloading from Pastebin.", threadID, messageID);
            }
        }

        // Handle Buildtooldev or TinyURL (raw HTML page with <pre><code>)
        if (url.includes("buildtool") || url.includes("tinyurl")) {
            request(url, (err, response, body) => {
                if (err) return api.sendMessage("❌ Failed to fetch the URL.", threadID, messageID);
                const $ = cheerio.load(body);
                const codeBlock = $(".language-js").first().text();
                if (!codeBlock) return api.sendMessage("❗ Could not find JavaScript code.", threadID, messageID);
                fs.writeFileSync(`${__dirname}/${args[0]}.js`, codeBlock, "utf-8");
                return api.sendMessage(`✅ Added code to ${args[0]}.js. Use 'load' to activate.`, threadID, messageID);
            });
            return;
        }

        // Handle Google Drive
        if (url.includes("drive.google")) {
            const idMatch = url.match(/[-\w]{25,}/);
            if (!idMatch) return api.sendMessage("❌ Invalid Google Drive link.", threadID, messageID);
            const fileId = idMatch[0];
            const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
            const outputPath = resolve(__dirname, `${args[0]}.js`);
            const writer = fs.createWriteStream(outputPath);
            const stream = request(downloadUrl).pipe(writer);
            stream.on("finish", () =>
                api.sendMessage(`✅ Added code to "${args[0]}.js". If errors occur, try saving as .txt in Drive.`, threadID, messageID)
            );
            stream.on("error", () =>
                api.sendMessage(`❌ Error writing "${args[0]}.js" from Drive.`, threadID, messageID)
            );
        }
    }
};
