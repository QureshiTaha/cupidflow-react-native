const { v4: uuidv4 } = require('uuid');
const { sqlQuery } = require('../../Modules/sqlHandler');
const moment = require('moment');

module.exports = {
  sendMessage: async (data) => {
    const { senderID, receiverID, chatID, message, messageType } = data;

    try {
      const messageID = uuidv4();
      const result = await sqlQuery(
        `INSERT INTO db_chat_messages (messageID, senderID, receiverID, chatID, message, messageType) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [messageID, senderID, receiverID, chatID, message, messageType]
      );
      if (result)
        return {
          success: true,
          message: 'Message Sent Successfully',
          data: [
            {
              messageID,
              senderID,
              receiverID,
              chatID,
              message,
              messageType,
              isRead: 0,
              timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
            }
          ]
        };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  markAllPreviousReadByReceiverID: async (data) => {
    const { receiverID, chatID } = data;
    try {
      const result = await sqlQuery(
        `UPDATE db_chat_messages SET isRead = 1 WHERE receiverID = ? AND chatID = ? AND isRead = 0`,
        [receiverID, chatID]
      );
      if (result) return { success: true, message: 'Messages marked as read successfully!', data: result };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  markMessageAsSeenByID: async (data) => {
    const { messageID } = data;
    try {
      const result = await sqlQuery(`UPDATE db_chat_messages SET isRead = 1 WHERE messageID = ?`, [messageID]);
      if (result) return { success: true, message: 'Message marked as seen successfully', data: result };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  getChatParticipants: async (data) => {
    const { chatID } = data;
    try {
      const result = await sqlQuery(`SELECT * FROM db_chat_members WHERE chatID = ?`, [chatID]);
      console.log(chatID, 'result', result);

      if (result) return { success: true, message: 'Participants found successfully!', data: result };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  getChatList: async (data) => {
    const { userID, limit, offset } = data;
    try {
      var result = await sqlQuery(
        `SELECT
                CASE
                    WHEN dc.chatType='private' THEN CASE
                        WHEN dc.createdBy= ?  THEN CONCAT (du2.userFirstName, ' ', du2.userSurname)
                        ELSE CONCAT (du1.userFirstName, ' ', du1.userSurname)
                    END
                    WHEN dc.chatType IN ('group', 'broadcast') THEN dc.chatName
                    ELSE 'Untitled'
                END AS chatName,
                dc.chatType,
                CASE
                    WHEN dc.chatType='private' THEN CASE
                        WHEN dc.createdBy= ?  THEN du2.userID
                        ELSE du1.userID
                    END
                    ELSE NULL
                END AS receiverUserID,
                CASE
                    WHEN dc.chatType='private' THEN CASE
                        WHEN dc.createdBy= ?  THEN du2.profilePic
                        ELSE du1.profilePic
                    END
                    ELSE NULL
                END AS profilePic,
                dc.chatID,
                cm.recentMessage,
                cm.recentMessageTimestamp,
                GROUP_CONCAT (DISTINCT CONCAT (du3.userFirstName, ' ', du3.userSurname) SEPARATOR ', ') AS chatMembers,
                COALESCE(unread.unreadCount, 0) AS unreadCount

            FROM
                db_chats dc
                LEFT JOIN db_users du1 ON dc.createdBy=du1.userID
                LEFT JOIN db_users du2 ON dc.chatWith=du2.userID

                -- Join recent message
                LEFT JOIN (
                    SELECT
                        chatID,
                        message   AS recentMessage,
                        TIMESTAMP AS recentMessageTimestamp
                    FROM
                        db_chat_messages
                    WHERE
                        (chatID, TIMESTAMP) IN (
                            SELECT
                                chatID,
                                MAX(TIMESTAMP)
                            FROM
                                db_chat_messages
                            GROUP BY
                                chatID
                        )
                ) cm ON dc.chatID=cm.chatID
                LEFT JOIN db_chat_members dcm ON dcm.chatID=dc.chatID
                LEFT JOIN db_users du3 ON du3.userID=dcm.userID
                LEFT JOIN (
                    SELECT
                        chatID,
                        COUNT(*) AS unreadCount
                    FROM
                        db_chat_messages
                    WHERE
                        isRead = 0
                        AND receiverID = ? 
                    GROUP BY chatID
                ) unread ON unread.chatID = dc.chatID

            WHERE
                (
                    dc.chatType='private'
                    AND (
                        dc.createdBy= ? 
                        OR dc.chatWith= ? 
                    )
                )
                OR (
                    dc.chatType IN ('group', 'broadcast')
                    AND dcm.userID= ? 
                )
            GROUP BY
                dc.chatID,
                chatName,
                dc.chatType,
                cm.recentMessage,
                cm.recentMessageTimestamp,
                profilePic,
                unread.unreadCount
            ORDER BY
                cm.recentMessageTimestamp DESC
            LIMIT ? OFFSET ?;
                `,
        [userID, userID, userID, userID, userID, userID, userID, limit, offset]
      );
      totalCount = await sqlQuery(`SELECT count(1) as count FROM db_chats WHERE createdBy = ? OR chatWith = ?`, [
        userID,
        userID
      ]);

      if (result.length > 0) {
        result[result.length - 1].haveMore = totalCount[0].count > offset + limit;
        result[result.length - 1].totalCount = totalCount[0].count;
      }

      if (result) return { success: true, message: 'Chat List found successfully!', data: result };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, message: error.message };
    }
  },
  getMessages: async (data) => {
    const { chatID, limit, offset, order } = data;
    try {
      var result = await sqlQuery(
        `SELECT 
                    m.messageID,
                    m.senderID,
                    CONCAT(u.userFirstName, ' ', u.userSurname) AS senderName,
                    m.message,
                    m.chatID,
                    m.messageType,
                    m.timestamp,
                    m.isRead
                FROM db_chat_messages m
                JOIN db_users u ON m.senderID = u.userID
                WHERE m.chatID = ?
                ORDER BY m.timestamp ${order}
                LIMIT ? OFFSET ?;`,
        [chatID, limit, offset]
      );

      const totalCount = await sqlQuery(`SELECT count(1) as count FROM db_chat_messages WHERE chatID = ?`, [chatID]);

      if (result.length > 0) {
        result[result.length - 1].haveMore = totalCount[0].count > offset + limit;
        result[result.length - 1].totalCount = totalCount[0].count;
      }

      if (result) return { success: true, message: 'Messages found successfully!', data: result };
      return { success: false, message: 'something Went wrong While SQL Query', data: [] };
    } catch (error) {
      console.error('Error getting messages:', error);
      return { success: false, message: error.message };
    }
  },
  createNewChat: async (data) => {
    const { chatName, chatType, createdBy, chatWith } = data;

    // Check If its private and already Exist..
    if (chatType == 'private') {
      const isPrivateChatExist = await sqlQuery(
        `SELECT * FROM db_chats WHERE chatType = 'private' AND (createdBy = ? AND chatWith = ?) OR (createdBy = ? AND chatWith = ?) LIMIT 1`,
        [createdBy, chatWith, chatWith, createdBy]
      );
      console.log('isPrivateChatExist', isPrivateChatExist);

      if (isPrivateChatExist.length > 0) {
        return { success: true, message: 'Private chat already exist', data: isPrivateChatExist };
      }
    }

    try {
      const chatID = uuidv4();
      const result = await sqlQuery(
        `INSERT INTO db_chats (chatID, chatName,chatWith, chatType, createdBy) 
                VALUES (?, ?, ?, ?, ?)`,
        [chatID, !chatName ? 'NULL' : chatName, !chatWith ? 'NULL' : chatWith, chatType, createdBy]
      );
      await sqlQuery(`INSERT INTO db_chat_members (chatID, userID) VALUES (?, ?)`, [chatID, createdBy]);
      if (chatWith) {
        await sqlQuery(`INSERT INTO db_chat_members (chatID, userID) VALUES (?, ?)`, [chatID, chatWith]);
      }

      if (result)
        return {
          success: true,
          message: 'Chat Created Successfully',
          data: [{ chatID, chatName, chatType, createdBy, chatWith }]
        };
      return {
        success: false,
        message: 'Something Went wrong While SQL Query',
        data: [chatID, !chatName ? 'NULL' : chatName, chatType, createdBy]
      };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  addUserToGroup: async (data) => {
    const { chatID, userID } = data;
    try {
      const result = await sqlQuery(`INSERT INTO db_chat_members (chatID, userID) VALUES (?, ?)`, [chatID, userID]);
      if (result) return { success: true, message: 'Chat Created Successfully', data: [{ chatID, userID }] };
      return { success: false, message: 'Something Went wrong While SQL Query', data: [chatID, userID] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  markMessageAsSeen: async (data) => {
    const { messageID } = data;
    try {
      const result = await sqlQuery(`UPDATE db_chat_messages SET isRead = 1 WHERE messageID = ?`, [messageID]);
      if (result) return { success: true, message: 'Message marked as seen successfully', data: [{ messageID }] };
      return { success: false, message: 'Something Went wrong While SQL Query', data: [messageID] };
    } catch (error) {
      console.error('Error sending msg:', error);
      return { success: false, message: error.message };
    }
  },
  markMessagesAsReadByChatID: async ({ chatID, userID }) => {
    try {
      const result = await sqlQuery(
        `UPDATE db_chat_messages SET isRead = 1 WHERE chatID = ? AND receiverID = ? AND isRead = 0`,
        [chatID, userID]
      );
      return {
        success: true,
        message: 'Messages marked as read',
        data: result
      };
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }
};
