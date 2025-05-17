const fs = require("fs");
const axios = require("axios");
const request = require("request");
const cheerio = require("cheerio");
const { resolve } = require("path");

module.exports = {
    name: "adc",
    version: "1.1.0",
    description: "Apply code from buildtooldev, Pastebin, or GDrive",
    commandCategory: "admin",
    usages: "[reply with link or provide file name]",
    cooldown: 0,
    admin: true,
    dependencies: {
        "axios": "",
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

            const content = fs.readFileSync(filePath, "utf-8");
            const pastebinKey = "eFk_nJ5A-5FzHmgk_t30MQ5iJv_o7xhu";

            try {
                const payload = new URLSearchParams({
                    api_dev_key: pastebinKey,
                    api_option: "paste",
                    api_paste_code: content,
                    api_paste_name: input,
                    api_paste_private: "1", // unlisted
                    api_paste_expire_date: "N"
                });

                const res = await axios.post("https://pastebin.com/api/api_post.php", payload.toString(), {
                    headers: { "Content-Type": "application/x-www-form-urlencoded" }
                });

                if (res.data.startsWith("http")) {
                    const rawLink = res.data.replace("pastebin.com/", "pastebin.com/raw/");
                    return api.sendMessage(`✅ Uploaded to Pastebin: ${rawLink}`, threadID, messageID);
                } else {
                    throw new Error(res.data);
                }
            } catch (err) {
                return api.sendMessage("❌ Failed to upload to Pastebin: " + err.message, threadID, messageID);
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
