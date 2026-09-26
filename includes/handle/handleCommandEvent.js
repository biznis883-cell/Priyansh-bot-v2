module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        try {
            if (!event) return;

            const { allowInbox = true } = global.config;
            const { userBanned, threadBanned } = global.data;
            const { commands, eventRegistered } = global.client;

            const senderID = String(event.senderID || "");
            const threadID = String(event.threadID || "");

            if (!senderID || !threadID) return;

            // لا تعالج رسائل البوت نفسه
            if (senderID === String(api.getCurrentUserID())) return;

            if (
                (userBanned && userBanned.has(senderID)) ||
                (threadBanned && threadBanned.has(threadID)) ||
                (allowInbox === false && senderID === threadID)
            ) {
                return;
            }

            if (!Array.isArray(eventRegistered)) return;

            for (const eventName of eventRegistered) {
                try {
                    const cmd = commands.get(eventName);

                    if (!cmd || typeof cmd.handleEvent !== "function") {
                        continue;
                    }

                    let getText = () => "";

                    if (
                        cmd.languages &&
                        typeof cmd.languages === "object" &&
                        cmd.languages[global.config.language]
                    ) {
                        getText = (...values) => {
                            let text =
                                cmd.languages[global.config.language][values[0]] || "";

                            for (let i = 1; i < values.length; i++) {
                                text = text.replace(
                                    new RegExp("%" + i, "g"),
                                    String(values[i])
                                );
                            }

                            return text;
                        };
                    }

                    const Obj = {
                        event,
                        api,
                        models,
                        Users,
                        Threads,
                        Currencies,
                        getText
                    };

                    await Promise.resolve(cmd.handleEvent(Obj));

                } catch (error) {
                    logger(
                        `Event command error: ${error.stack || error.message}`,
                        "error"
                    );
                }
            }

        } catch (error) {
            logger(
                `handleCommandEvent error: ${error.stack || error.message}`,
                "error"
            );
        }
    };
};
