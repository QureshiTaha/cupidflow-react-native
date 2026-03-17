import SQLite from "react-native-sqlite-storage";
// import React, { useEffect} from "react";

SQLite.DEBUG(false);
SQLite.enablePromise(true);

let dbInstance = null;

// Add this useEffect near the top of your component
export const initDatabase = async () => {
  try {
    if (dbInstance) {
      return dbInstance;
      await dbInstance.close();
      dbInstance = null;
    }

    dbInstance = await SQLite.openDatabase({
      name: "Blush.db",
      location: "default",
    });

    // For development: drop and recreate tables
    await createTables(dbInstance);

    // For production: use migration approach
    await migrateDatabase(dbInstance);

    await createIndexes(dbInstance);

    console.log("Database initialized successfully");
    return dbInstance;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
};

const createTables = async (db) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // First drop tables if they exist
        // tx.executeSql('DROP TABLE IF EXISTS messages');
        // tx.executeSql('DROP TABLE IF EXISTS chats');
        // tx.executeSql('DROP TABLE IF EXISTS chat_members');

        // Then create fresh tables
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          messageID TEXT UNIQUE,
          senderID TEXT,
          receiverID TEXT,
          chatID TEXT,
          message TEXT,
          messageType TEXT,
          timestamp TEXT,
          isRead INTEGER DEFAULT 0,
          isSent INTEGER DEFAULT 0,
          localUri TEXT,
          failed INTEGER DEFAULT 0,
          thumbnailUri TEXT
        )`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS cached_images (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT UNIQUE,
          localPath TEXT,
          lastAccessed TEXT
        )`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS chats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chatID TEXT UNIQUE,
          userID TEXT,
          chatType TEXT,
          chatName TEXT,
          receiverUserID TEXT,
          profilePic TEXT,
          recentMessage TEXT,
          recentMessageTimestamp TEXT,
          chatMembers TEXT,
          unreadCount INTEGER DEFAULT 0,
          chatWith TEXT,
          createdBy TEXT,
          createdAt TEXT,
          lastMessage TEXT,
          lastMessageTime TEXT
        )`
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS chat_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chatID TEXT,
          userID TEXT,
          joinedAt TEXT,
          UNIQUE(chatID, userID)
        )`
        );
      },
      (error) => reject(error),
      () => resolve()
    );
  });
};

const createIndexes = async (db) => {
  return new Promise((resolve, reject) => {
    db.transaction(
      (tx) => {
        // Index for messages table
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_messages_chatID ON messages (chatID)`,
          [],
          () => {},
          (_, error) => {
            console.error("Error creating chatID index:", error);
            return false;
          }
        );

        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp)`,
          [],
          () => {},
          (_, error) => {
            console.error("Error creating timestamp index:", error);
            return false;
          }
        );

        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages (senderID)`,
          [],
          () => {},
          (_, error) => {
            console.error("Error creating sender index:", error);
            return false;
          }
        );

        // Index for chat_members table
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_members_userID ON chat_members (userID)`,
          [],
          () => {},
          (_, error) => {
            console.error("Error creating userID index:", error);
            return false;
          }
        );
        // Index for messages.thumbnailUri
        tx.executeSql(
          `CREATE INDEX IF NOT EXISTS idx_messages_thumbnail ON messages (thumbnailUri)`,
          [],
          () => {},
          (_, error) => {
            console.error("Error creating thumbnailUri index:", error);
            return false;
          }
        );
      },
      (error) => {
        console.error("Index creation error:", error);
        reject(error);
      },
      () => {
        console.log("All indexes created successfully");
        resolve();
      }
    );
  });
};

const executeSql = async (sql, params = []) => {
  if (!dbInstance) {
    await initDatabase();
  }

  try {
    return await new Promise((resolve, reject) => {
      dbInstance.transaction(
        (tx) => {
          tx.executeSql(
            sql,
            params,
            (_, result) => resolve(result),
            (_, error) => {
              console.error("SQL Error:", { sql, params, error });
              reject(error);
            }
          );
        },
        (error) => {
          console.error("Transaction error:", error);
          reject(error);
        }
      );
    });
  } catch (error) {
    console.error("Error in executeSql:", { sql, params, error });
    throw error;
  }
};
const migrateDatabase = async (db) => {
  try {
    // --- MIGRATION FOR CHATS TABLE ---
    const chatsTableCheck = await executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='chats'"
    );

    if (chatsTableCheck.rows && chatsTableCheck.rows.length > 0) {
      const chatsTableInfo = await executeSql("PRAGMA table_info(chats)");
      const chatColumns = chatsTableInfo.rows.raw();
      const hasUserID = chatColumns.some((col) => col.name === "userID");

      if (!hasUserID) {
        console.log(
          "Migrating chats table to add userID column and other fields"
        );

        // Backup existing chats
        const oldChats = await executeSql("SELECT * FROM chats");
        const chatRows = oldChats.rows.raw();
        console.log(`Migrating ${chatRows.length} chat records`);

        await executeSql(`
          CREATE TABLE chats_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chatID TEXT UNIQUE,
            userID TEXT,
            chatType TEXT,
            chatName TEXT,
            receiverUserID TEXT,
            profilePic TEXT,
            recentMessage TEXT,
            recentMessageTimestamp TEXT,
            chatMembers TEXT,
            unreadCount INTEGER DEFAULT 0,
            chatWith TEXT,
            createdBy TEXT,
            createdAt TEXT,
            lastMessage TEXT,
            lastMessageTime TEXT
          )`);

        // Reinsert rows into new table
        for (const row of chatRows) {
          await executeSql(
            `INSERT INTO chats_new 
            (id, chatID, chatType, chatName, chatWith, createdBy, createdAt, 
             lastMessage, lastMessageTime, userID, receiverUserID, profilePic, 
             recentMessage, recentMessageTimestamp, chatMembers, unreadCount)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              row.id,
              row.chatID,
              row.chatType || "private",
              row.chatName || "",
              row.chatWith || "",
              row.createdBy || "",
              row.createdAt || new Date().toISOString(),
              row.lastMessage || "",
              row.lastMessageTime || new Date().toISOString(),
              row.userID || "", // fallback empty if not present
              row.receiverUserID || "",
              row.profilePic || "",
              row.recentMessage || "",
              row.recentMessageTimestamp || new Date().toISOString(),
              row.chatMembers || "",
              row.unreadCount || 0,
            ]
          );
        }

        // Replace old table
        await executeSql("DROP TABLE chats");
        await executeSql("ALTER TABLE chats_new RENAME TO chats");
        console.log("Chats table migration completed successfully");
      } else {
        console.log("Chats table already has userID, skipping migration");
      }
    } else {
      console.log("Chats table does not exist yet, skipping migration");
    }

    // --- MIGRATION FOR MESSAGES TABLE ---
    const messagesTableCheck = await executeSql(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'"
    );

    if (messagesTableCheck.rows && messagesTableCheck.rows.length > 0) {
      const messagesTableInfo = await executeSql("PRAGMA table_info(messages)");
      const messageColumns = messagesTableInfo.rows.raw();
      const hasThumbnail = messageColumns.some(
        (col) => col.name === "thumbnailUri"
      );

      if (!hasThumbnail) {
        console.log("Migrating messages table to add thumbnailUri column");
        await executeSql(`ALTER TABLE messages ADD COLUMN thumbnailUri TEXT`);
        console.log("Messages table migration completed successfully");
      } else {
        console.log(
          "Messages table already has thumbnailUri, skipping migration"
        );
      }
    } else {
      console.log("Messages table does not exist yet, skipping migration");
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

export const DatabaseService = {
  initDatabase,
  resetDatabase: async () => {
    try {
      // drop all tables
      await executeSql("DROP TABLE IF EXISTS messages");
      await executeSql("DROP TABLE IF EXISTS chats");
      await executeSql("DROP TABLE IF EXISTS chat_members");
      await executeSql("DROP TABLE IF EXISTS cached_images");
      // recreate empty schema
      await createTables(dbInstance || (await initDatabase()));
      await createIndexes(dbInstance);
      console.log("[DB] Local database reset completed");
    } catch (e) {
      console.error("[DB] resetDatabase error:", e);
      throw e;
    }
  },
  saveChatList: async (chatList, userID) => {
    console.log("[saveChatList] Starting with", chatList.length, "chats");
    try {
      await executeSql("BEGIN TRANSACTION");

      // Clear old chats first (only for this user)
      const deleteResult = await executeSql(
        "DELETE FROM chats WHERE userID = ?",
        [userID]
      );
      console.log(
        "[saveChatList] Deleted",
        deleteResult.rowsAffected,
        "old chats"
      );

      // Use INSERT OR REPLACE to handle duplicates
      for (const chat of chatList) {
        try {
          const insertResult = await executeSql(
            `INSERT OR REPLACE INTO chats 
          (chatID, userID, chatType, chatName, receiverUserID, profilePic, 
           recentMessage, recentMessageTimestamp, chatMembers, unreadCount,
           chatWith, createdBy, createdAt, lastMessage, lastMessageTime) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              chat.chatID,
              userID,
              chat.chatType || "private",
              chat.chatName || "",
              chat.receiverUserID || "",
              chat.profilePic || "",
              chat.recentMessage || "",
              chat.recentMessageTimestamp || new Date().toISOString(),
              chat.chatMembers || "",
              chat.unreadCount || 0,
              chat.receiverUserID || "",
              userID,
              chat.createdAt || new Date().toISOString(),
              chat.lastMessage || "",
              chat.lastMessageTime || new Date().toISOString(),
            ]
          );
        } catch (insertError) {
          console.error(
            `[saveChatList] Error saving chat ${chat.chatID}:`,
            insertError.message
          );
          // Continue with next chat even if one fails
        }
      }

      await executeSql("COMMIT");
    } catch (error) {
      await executeSql("ROLLBACK");
      throw error;
    }
  },
  // Get chat list from local DB
  getChatList: async (userID) => {
    try {
      const result = await executeSql(
        "SELECT * FROM chats WHERE userID = ? ORDER BY recentMessageTimestamp DESC",
        [userID]
      );
      const chats = result.rows.raw();
      console.log("Raw database result:", chats.length, "chats found");
      return chats;
    } catch (error) {
      console.error("Error in getChatList:", error);
      return []; // Return empty array instead of failing
    }
  },

  // Add this to DatabaseService

  cacheImage: async (url, localPath) => {
    try {
      await executeSql(
        `INSERT OR REPLACE INTO cached_images 
      (url, localPath, lastAccessed) 
      VALUES (?, ?, ?)`,
        [url, localPath, new Date().toISOString()]
      );
    } catch (error) {
      console.error("Error caching image:", error);
      throw error;
    }
  },

  getCachedImage: async (url) => {
    try {
      const result = await executeSql(
        `SELECT localPath FROM cached_images WHERE url = ? LIMIT 1`,
        [url]
      );
      return result.rows.item(0)?.localPath || null;
    } catch (error) {
      console.error("Error getting cached image:", error);
      return null;
    }
  },

  clearOldCachedImages: async (maxAgeDays = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

      await executeSql(`DELETE FROM cached_images WHERE lastAccessed < ?`, [
        cutoffDate.toISOString(),
      ]);
    } catch (error) {
      console.error("Error clearing old cached images:", error);
      throw error;
    }
  },

  // Mark messages as read in local DB
  markChatMessagesAsRead: async (chatID, userID) => {
    try {
      // Reset unread count in chats table
      await executeSql(
        "UPDATE chats SET unreadCount = 0 WHERE chatID = ? AND userID = ?",
        [chatID, userID]
      );

      // Mark all messages in this chat as read (except my own messages)
      await executeSql(
        "UPDATE messages SET isRead = 1 WHERE chatID = ? AND senderID != ?",
        [chatID, userID]
      );
    } catch (error) {
      console.error("Error marking messages as read:", error.message);
    }
  },

  // In DatabaseService.js
  updateMessageReadStatus: async (messageID, isRead) => {
    try {
      await executeSql(`UPDATE messages SET isRead = ? WHERE messageID = ?`, [
        isRead,
        messageID,
      ]);
    } catch (error) {
      console.error("Error updating message read status:", error);
      throw error;
    }
  },

  updateMessageThumbnail: async (messageID, thumbnailUri) => {
    try {
      await executeSql(
        `UPDATE messages 
       SET thumbnailUri = ? 
       WHERE messageID = ?`,
        [thumbnailUri, messageID]
      );
      console.log(`[DB] Thumbnail updated for message ${messageID}`);
    } catch (error) {
      console.error("[DB] Error updating thumbnail:", error);
      throw error;
    }
  },

  // In database.js, update the markMessagesAsSeen function:
  markMessagesAsSeen: async (messageIDs) => {
    try {
      if (messageIDs.length === 0) return;

      const placeholders = messageIDs.map(() => "?").join(",");
      await executeSql(
        `UPDATE messages SET isRead = 1 WHERE messageID IN (${placeholders})`,
        messageIDs
      );
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      throw error;
    }
  },
  // Message operations
  saveMessage: async (message) => {
    try {
      const result = await executeSql(
        `INSERT OR REPLACE INTO messages 
      (messageID, senderID, receiverID, chatID, message, messageType, timestamp, isRead, isSent, failed, thumbnailUri) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          message.messageID,
          message.senderID,
          message.receiverID,
          message.chatID,
          message.message,
          message.messageType,
          message.timestamp,
          message.isRead || 0,
          message.isSent || 0,
          message.failed || 0,
          message.thumbnailUri || null,
        ]
      );
      return result;
    } catch (error) {
      console.error("Error saving message:", { message, error });
      throw error;
    }
  },

  getMessages: async (chatID, minTimestamp = null) => {
    try {
      let sql = `SELECT * FROM messages WHERE chatID = ?`;
      const params = [chatID];

      if (minTimestamp) {
        sql += ` AND timestamp < ?`;
        params.push(minTimestamp);
      }

      sql += ` ORDER BY timestamp DESC`;
      params.push();

      const result = await executeSql(sql, params);
      return result.rows.raw();
    } catch (error) {
      console.error("Error fetching messages:", {
        chatID,
        limit,
        offset,
        error,
      });
      return [];
    }
  },

  getMessageById: async (messageID) => {
    try {
      const result = await executeSql(
        `SELECT * FROM messages WHERE messageID = ? LIMIT 1`,
        [messageID]
      );
      return result.rows.item(0) || null;
    } catch (error) {
      console.error("Error fetching message:", { messageID, error });
      return null;
    }
  },

  getUnsentMessages: async () => {
    try {
      const result = await executeSql(
        `SELECT * FROM messages WHERE isSent = 0 AND failed = 0`
      );
      return result.rows.raw();
    } catch (error) {
      console.error("Error fetching unsent messages:", error);
      return [];
    }
  },

  markMessageAsSent: async (messageID) => {
    try {
      const result = await executeSql(
        `UPDATE messages SET isSent = 1 WHERE messageID = ?`,
        [messageID]
      );
      return result;
    } catch (error) {
      console.error("Error marking message as sent:", { messageID, error });
      throw error;
    }
  },

  markMessagesAsSent: async (messageIDs) => {
    try {
      const placeholders = messageIDs.map(() => "?").join(",");
      const result = await executeSql(
        `UPDATE messages SET isSent = 1 WHERE messageID IN (${placeholders})`,
        messageIDs
      );
      return result;
    } catch (error) {
      console.error("Error marking messages as sent:", { messageIDs, error });
      throw error;
    }
  },

  markMessageAsFailed: async (messageID) => {
    try {
      const result = await executeSql(
        `UPDATE messages SET failed = 1 WHERE messageID = ?`,
        [messageID]
      );
      return result;
    } catch (error) {
      console.error("Error marking message as failed:", { messageID, error });
      throw error;
    }
  },

  checkDuplicateMessage: async (message) => {
    try {
      const result = await executeSql(
        `SELECT 1 FROM messages 
         WHERE chatID = ? AND senderID = ? AND message = ? 
         AND timestamp > datetime('now', '-5 seconds')`,
        [message.chatID, message.senderID, message.message]
      );
      return result.rows.length > 0;
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  },

  // Chat operations
  saveChat: async (chat) => {
    try {
      const result = await executeSql(
        `INSERT OR REPLACE INTO chats 
        (chatID, chatType, chatName, chatWith, createdBy, createdAt, lastMessage, lastMessageTime) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          chat.chatID,
          chat.chatType,
          chat.chatName,
          chat.chatWith,
          chat.createdBy,
          chat.createdAt,
          chat.lastMessage,
          chat.lastMessageTime,
        ]
      );
      return result;
    } catch (error) {
      console.error("Error saving chat:", error);
      throw error;
    }
  },

  getChat: async (chatID) => {
    try {
      const result = await executeSql(
        `SELECT * FROM chats WHERE chatID = ? LIMIT 1`,
        [chatID]
      );
      return result.rows.item(0);
    } catch (error) {
      console.error("Error fetching chat:", error);
      return null;
    }
  },

  // Chat member operations
  saveChatMember: async (member) => {
    try {
      const result = await executeSql(
        `INSERT OR REPLACE INTO chat_members 
        (chatID, userID, joinedAt) 
        VALUES (?, ?, ?)`,
        [member.chatID, member.userID, member.joinedAt]
      );
      return result;
    } catch (error) {
      console.error("Error saving chat member:", error);
      throw error;
    }
  },

  // Additional utility methods
  getAllUserChats: async (userID) => {
    try {
      const result = await executeSql(
        `SELECT c.* FROM chats c
        JOIN chat_members cm ON c.chatID = cm.chatID
        WHERE cm.userID = ?`,
        [userID]
      );
      return result.rows.raw();
    } catch (error) {
      console.error("Error fetching user chats:", error);
      return [];
    }
  },

  // For cleanup purposes
  deleteOldMessages: async (days = 30) => {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const result = await executeSql(
        `DELETE FROM messages 
        WHERE timestamp < ? 
        AND isSent = 1`,
        [cutoffDate.toISOString()]
      );
      return result;
    } catch (error) {
      console.error("Error deleting old messages:", error);
      throw error;
    }
  },
};

// Initialize the database when this module is imported
// initDatabase();

// At the bottom of database.js, ensure you have:
export default DatabaseService;