const chatUseCases = require('./chatUseCase');

module.exports = (dependencies) => {
    return {
        sendMessage: async (req, res) => {
            const { senderID, receiverID, chatID, message, messageType } = req.body;
            if (!senderID || !receiverID || !chatID || !message || !messageType) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            const result = await chatUseCases.sendMessage({ senderID, receiverID, chatID, message, messageType });
            res.status(result.success ? 200 : 500).json(result);
        },

        getChatList: async (req, res) => {
            const { limit = 10, page } = req.query;
            const { userID } = req.params;
            if (!userID) {
                return res.status(400).json({ success: false, message: 'userID is required' });
            }
            const result = await chatUseCases.getChatList({ userID, limit: parseInt(!limit ? 10 : limit), offset: parseInt(!page ? 0 : (page - 1) * limit) });
            res.status(result.success ? 200 : 500).json(result);
        },
        getMessages: async (req, res) => {
            const { limit = 10, page, order } = req.query;
            const { chatID } = req.params;

            if (!chatID) {
                return res.status(400).json({ success: false, message: 'chatID is required' });
            }
            const result = await chatUseCases.getMessages({ chatID, limit: parseInt(!limit ? 10 : limit), offset: parseInt(!page ? 0 : (page - 1) * limit), order: order ? order : 'asc' });
            res.status(result.success ? 200 : 500).json(result);
        },
        createNewChat: async (req, res) => {
            const { chatName, chatType, createdBy, chatWith } = req.body;
            if (!chatType || !createdBy) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            if (chatType === 'private' && !chatWith) {
                return res.status(400).json({ success: false, message: 'private chat requires chatWith, Missing required fields' });
            }
            const result = await chatUseCases.createNewChat({ chatName, chatType, createdBy, chatWith });
            res.status(result.success ? 200 : 500).json(result);
        },
        addUserToGroup: async (req, res) => {
            const { chatID, userID } = req.body;
            if (!chatID || !userID) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
            const result = await chatUseCases.addUserToGroup({ chatID, userID });
            res.status(result.success ? 200 : 500).json(result);
        },
        markAllPreviousReadByReceiverID: async (req, res) => {
        const { receiverID, chatID } = req.body;
        
        if (!receiverID || !chatID) {
            return res.status(400).json({ success: false, message: 'receiverID and chatID are required' });
        }

        const result = await chatUseCases.markAllPreviousReadByReceiverID({ receiverID, chatID });
        res.status(result.success ? 200 : 500).json(result);
        },
        markMessageAsSeenByID: async (data) => {
        const { messageID } = data;
        const result = await sqlQuery( 
            `UPDATE db_chat_messages SET isRead = 1 WHERE messageID = ?`,
            [messageID]
        );
        return result
            ? { success: true, message: "Message marked as seen successfully", data: result }
            : { success: false, message: "Something went wrong", data: [] };
        },        
        markMessagesAsReadByChatID: async (req, res) => {
        const { chatID, userID } = req.body;

        if (!chatID || !userID) {
            return res.status(400).json({ success: false, message: 'chatID and userID are required' });
        }

        const result = await chatUseCases.markMessagesAsReadByChatID({ chatID, userID });
        res.status(result.success ? 200 : 500).json(result);
        },
    }
};