module.exports = function ({ api, models, Users, Threads, Currencies }) {
    const logger = require("../../utils/log.js");

    return async function ({ event }) {
        try {
            if (!event || !event.messageReply) return;

            const { handleReply, commands } = global.client;

            if (!Array.isArray(handleReply) || handleReply.length === 0) {
                return;
            }

            const senderID = String(event.senderID || "");
            const threadID = String(event.threadID || "");

            if (senderID === String(api.getCurrentUserID())) return;

            const replyMessageID = event.messageReply.messageID;

            const index = handleReply.findIndex(
                item => item.messageID === replyMessageID
            );

            if (index === -1) return;

            const replyData = handleReply[index];

            const command = commands.get(replyData.name);

            if (!command || typeof command.handleReply !== "function") {
                return;
            }

            let getText = () => "";

            if (
                command.languages &&
                typeof command.languages === "object" &&
                command.languages[global.config.language]
            ) {
                getText = (...values) => {
                    let text =
                        command.languages[global.config.language][values[0]] || "";

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
                api,
                event,
                models,
                Users,
                Threads,
                Currencies,
                handleReply: replyData,
                getText
            };

            await Promise.resolve(command.handleReply(Obj));

        } catch (error) {
            logger(
                `handleReply error: ${error.stack || error.message}`,
                "error"
            );
        }
    };
};
