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
    usages: "[reply with link or provide file name]",
    cooldown: 0,
    admin: true,
    dependencies: {
        "pastebin-api": "",
        "cheerio": "",
        "request": ""
    },

    execute: async function ({ api, event, args }) {
        const { threadID, messageID, messageReply, type } = event;

        let input = args[0];
        if (type === "message_reply" && messageReply?.body) {
            input = messageReply.body;
        }

        if (!input) {
            return api.sendMessage("❗ Please reply with a link or provide a file name.", threadID, messageID);
        }

        const urlRegex = /https?:\/\/[^\s]+/;
        const urlMatch = input.match(urlRegex);
        const isURL = !!urlMatch;

        // Upload local file to Pastebin
        if (!isURL) {
            const filePath = `${__dirname}/${input}.js`;
            if (!fs.existsSync(filePath)) {
                return api.sendMessage(`❌ File "${input}.js" does not exist.`, threadID, messageID);
            }
            const data = fs.readFileSync(filePath, "utf-8");
            const client = new PasteClient("yN6fAVCx2yoTsarD7ZZETM0UXsLyjq4d
");
            try {
                const url = await client.createPaste({
                    code: data,
                    expireDate: "N",
                    format: "javascript",
                    name: input,
                    publicity: 1
                });
                const id = url.split("/").pop();
                return api.sendMessage(`✅ Uploaded to Pastebin: https://pastebin.com/raw/${id}`, threadID, messageID);
            } catch (e) {
                return api.sendMessage("❌ Failed to upload to Pastebin.", threadID, messageID);
            }
        }

        // If URL, handle download logic
        const url = urlMatch[0];
        const filename = args[1] || "downloaded";

        if (url.includes("pastebin")) {
            try {
                const res = await axios.get(url.replace("/view/", "/raw/"));
                fs.writeFileSync(`${__dirname}/${filename}.js`, res.data, "utf-8");
                return api.sendMessage(`✅ Saved code as "${filename}.js". Use 'load' to activate.`, threadID, messageID);
            } catch {
                return api.sendMessage("❌ Failed to download from Pastebin.", threadID, messageID);
            }
        }

        if (url.includes("buildtool") || url.includes("tinyurl")) {
            request(url, (err, res, body) => {
                if (err) return api.sendMessage("❌ Failed to fetch the URL.", threadID, messageID);
                const $ = cheerio.load(body);
                const code = $("pre code").text().trim();
                if (!code) return api.sendMessage("❗ No code block found.", threadID, messageID);
                fs.writeFileSync(`${__dirname}/${filename}.js`, code, "utf-8");
                return api.sendMessage(`✅ Saved code as "${filename}.js". Use 'load' to activate.`, threadID, messageID);
            });
            return;
        }

        if (url.includes("drive.google")) {
            const idMatch = url.match(/[-\w]{25,}/);
            if (!idMatch) return api.sendMessage("❌ Invalid Google Drive link.", threadID, messageID);
            const fileId = idMatch[0];
            const downloadUrl = `https://drive.google.com/uc?id=${fileId}&export=download`;
            const outputPath = resolve(__dirname, `${filename}.js`);
            const writer = fs.createWriteStream(outputPath);
            const stream = request(downloadUrl).pipe(writer);
            stream.on("finish", () =>
                api.sendMessage(`✅ Downloaded from Drive to "${filename}.js".`, threadID, messageID)
            );
            stream.on("error", () =>
                api.sendMessage(`❌ Failed to download from Drive.`, threadID, messageID)
            );
        } else {
            return api.sendMessage("❗ Invalid or unsupported URL.", threadID, messageID);
        }
    }
};
