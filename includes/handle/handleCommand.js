module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const stringSimilarity = require("string-similarity");
    const logger = require("../../utils/log.js");

    const escapeRegex = (str) =>
        String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return async function ({ event }) {
        try {
            if (!event || !event.body) return;

            const {
                PREFIX = "!",
                ADMINBOT = [],
                NDH = [],
                DeveloperMode = false,
                allowInbox = true
            } = global.config;

            const { userBanned, threadBanned, threadInfo, threadData, commandBanned } = global.data;
            const { commands, cooldowns } = global.client;

            const senderID = String(event.senderID);
            const threadID = String(event.threadID);
            const body = String(event.body);

            // منع البوت من معالجة رسائل نفسه
            if (senderID === String(api.getCurrentUserID())) return;

            // بيانات المجموعة
            let settings = threadData.get(threadID) || {};
            const prefix = settings.PREFIX || PREFIX;

            const prefixRegex = new RegExp(
                `^(<@!?${escapeRegex(senderID)}>|${escapeRegex(prefix)})\\s*`,
                "i"
            );

            if (!prefixRegex.test(body)) return;

            // منع inbox إذا كان ممنوعا
            if (
                allowInbox === false &&
                senderID === threadID &&
                !ADMINBOT.includes(senderID)
            ) {
                return;
            }

            // banned user
            if (userBanned && userBanned.has(senderID) && !ADMINBOT.includes(senderID)) {
                const data = userBanned.get(senderID) || {};
                return api.sendMessage(
                    `You are banned from using the bot.\nReason: ${data.reason || "No reason"}`,
                    threadID,
                    null,
                    event.messageID
                );
            }

            // banned thread
            if (threadBanned && threadBanned.has(threadID) && !ADMINBOT.includes(senderID)) {
                const data = threadBanned.get(threadID) || {};
                return api.sendMessage(
                    `This group is banned from using the bot.\nReason: ${data.reason || "No reason"}`,
                    threadID,
                    null,
                    event.messageID
                );
            }

            const matchedPrefix = body.match(prefixRegex)?.[0];
            if (!matchedPrefix) return;
