const fs = require("fs");
const axios = require("axios");
const request = require("request");
const cheerio = require("cheerio");
const { resolve } = require("path");
const { PasteClient } = require("pastebin-api");

module.exports = {
    name: "adc",
    version: "1.0.1",
    description: "Upload local code or fetch from URL (Pastebin, Buildtool, GDrive)",
    commandCategory: "admin",
    usages: "[filename or URL]",
    cooldown: 3,
    admin: true,

    execute: async function ({ api, event, args }) {
        const { threadID, messageID, messageReply, type } = event;

        let input = args[0];
        if (type === "message_reply" && messageReply?.body) {
            input = messageReply.body.trim();
        }

        if (!input) {
            return api.sendMessage("❗ Reply with a Pastebin/Buildtool/Drive link or a file name (without .js)", threadID, messageID);
        }

        const urlRegex = /https?:\/\/[^\s]+/;
        const urlMatch = input.match(urlRegex);
        const isURL = !!urlMatch;

        // If not a URL, try uploading local file to Pastebin
        if (!isURL) {
            const filePath = `${__dirname}/${input}.js`;
            if (!fs.existsSync(filePath)) {
                return api.sendMessage(`❌ File "${input}.js" does not exist.`, threadID, messageID);
            }

            const content = fs.readFileSync(filePath, "utf-8");
            const client = new PasteClient("eFk_nJ5A-5FzHmgk_t30MQ5iJv_o7xhu");

            try {
                const url = await client.createPaste({
                    code: content,
                    name: input,
                    format: "javascript",
                    expireDate: "N",
                    publicity: 1
                });

                const id = url.split("/").pop();
                return api.sendMessage(`✅ Uploaded: https://pastebin.com/raw/${id}`, threadID, messageID);
            } catch (e) {
                return api.sendMessage("❌ Failed to upload to Pastebin. Check your API key or internet.", threadID, messageID);
            }
        }

        // Handle URL downloads
        const url = urlMatch[0];
        const filename = args[1] || "downloaded";

        if (url.includes("pastebin")) {
            try {
                const raw = url.replace("/view/", "/raw/").replace("pastebin.com/", "pastebin.com/raw/");
                const res = await axios.get(raw);
                fs.writeFileSync(`${__dirname}/${filename}.js`, res.data, "utf-8");
                return api.sendMessage(`✅ Saved as "${filename}.js". Use 'load' to activate.`, threadID, messageID);
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
                return api.sendMessage(`✅ Saved as "${filename}.js". Use 'load' to activate.`, threadID, messageID);
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
            return api.sendMessage("❗ Unsupported or invalid URL format.", threadID, messageID);
        }
    }
};
