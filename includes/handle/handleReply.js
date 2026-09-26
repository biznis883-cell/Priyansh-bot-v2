module.exports = function ({ api, models, Users, Threads, Currencies }) {
    return async function ({ event }) {
        if (!event.messageReply) return;

        const { handleReply = [], commands } = global.client || {};
        const { messageID, threadID, messageReply } = event;

        if (!commands || !messageReply || handleReply.length === 0) return;

        const indexOfHandle = handleReply.findIndex(
            e => e.messageID == messageReply.messageID
        );

        if (indexOfHandle < 0) return;

        const indexOfMessage = handleReply[indexOfHandle];
        const handleNeedExec = commands.get(indexOfMessage.name);

        if (!handleNeedExec) {
            return api.sendMessage(
                global.getText('handleReply', 'missingValue'),
                threadID,
                messageID
            );
        }

        try {
            let getText2;

            if (
                handleNeedExec.languages &&
                typeof handleNeedExec.languages === 'object'
            ) {
                getText2 = (...value) => {
                    const languages = handleNeedExec.languages;
                    const language = global.config?.language;

                    if (!languages[language]) {
                        return api.sendMessage(
                            global.getText(
                                'handleCommand',
                                'notFoundLanguage',
                                handleNeedExec.config.name
                            ),
                            threadID,
                            messageID
                        );
                    }

                    let lang =
                        languages[language][value[0]] || '';

                    for (let i = value.length; i > 0; i--) {
                        const expReg = new RegExp('%' + i, 'g');
                        lang = lang.replace(expReg, value[i]);
                    }

                    return lang;
                };
            } else {
                getText2 = () => {};
            }

            const Obj = {
                api,
                event,
                models,
                Users,
                Threads,
                Currencies,
                handleReply: indexOfMessage,
                getText: getText2
            };

            await handleNeedExec.handleReply(Obj);

        } catch (error) {
            console.error('handleReply error:', error);

            return api.sendMessage(
                global.getText(
                    'handleReply',
                    'executeError',
                    error.message
                ),
                threadID,
                messageID
            );
        }
    };
};
