import axios from "axios";
import { DatabaseService } from "./database";

/**
 * Normalize and sort messages by timestamp DESC (newest first).
 */
const normalizeAndSortDesc = (list = []) => {
  return [...list]
    .map((m) => ({
      ...m,
      // ensure timestamp is ISO string; server/DB might already be ISO
      timestamp:
        typeof m.timestamp === "string"
          ? m.timestamp
          : new Date(m.timestamp).toISOString(),
    }))
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

export const MessageService = {
  /**
   * Fetch messages from local DB or server
   * Strategy:
   * - Keep UI state in DESC order (newest first) so FlatList (inverted) works naturally.
   * - For initial load: try local; if insufficient, hit server.
   * - For pagination (older): request server with order=desc, page>1 returns older items.
   *
   * @param {string} chatID
   * @param {number} pageNum
   * @param {number} limit
   * @param {boolean} initialLoad
   * @param {boolean} initialLoadComplete
   * @returns {Object} { messages (DESC), hasMore, error }
   */
  fetchMessages: async (
    chatID,
    pageNum = 1,
    limit = 10,
    initialLoad = false,
    initialLoadComplete = false
  ) => {
    try {
      // 1) Local DB first (always helpful for quick paint)
      const localMessages = await DatabaseService.getMessages(
        chatID,
        limit,
        (pageNum - 1) * limit
      );
      const localSortedDesc = normalizeAndSortDesc(localMessages);

      if (initialLoad && localSortedDesc.length > 0) {
        return {
          messages: localSortedDesc,
          hasMore: localSortedDesc.length === limit,
          error: null,
        };
      }

      // 2) Server fetch (DESC = newest first, so pagination loads older chunks as page increases)
      const res = await axios.get(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/get-messages/${chatID}?limit=${limit}&page=${pageNum}&order=desc`
      );

      if (res.data?.success) {
        const serverMessages = normalizeAndSortDesc(res.data.data || []);

        // Persist to local DB
        if (serverMessages.length) {
          await Promise.all(
            serverMessages.map((msg) =>
              DatabaseService.saveMessage({
                messageID: msg.messageID,
                senderID: msg.senderID,
                receiverID: msg.receiverID,
                chatID: msg.chatID,
                message: msg.message,
                messageType: msg.messageType,
                timestamp: msg.timestamp,
                isRead: msg.isRead,
                isSent: 1,
              })
            )
          );
        }

        return {
          messages: serverMessages,
          hasMore:
            typeof res.data?.pagination?.hasMore === "boolean"
              ? res.data.pagination.hasMore
              : serverMessages.length === limit,
          error: null,
        };
      }

      return {
        messages: [],
        hasMore: false,
        error: "Failed to fetch messages",
      };
    } catch (err) {
      console.error("Error fetching messages:", err);

      // Fallback: on initial load or when server fails, serve local chunk
      const fallback = await DatabaseService.getMessages(
        chatID,
        limit,
        (pageNum - 1) * limit
      );
      const sortedDesc = normalizeAndSortDesc(fallback);

      return {
        messages: sortedDesc,
        hasMore: sortedDesc.length === limit,
        error: err?.message || "Network error",
      };
    }
  },

  /**
   * Mark all messages in a chat as read (for current user)
   * @param {string} chatID
   * @param {string} userID
   */
  markMessagesAsRead: async (chatID, userID) => {
    try {
      // Optimistic local update
      await DatabaseService.markChatMessagesAsRead(chatID, userID);

      // Update server (fire-and-forget semantics for resilience)
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/mark-all-read`,
        { receiverID: userID, chatID }
      );

      return { success: true, error: null };
    } catch (err) {
      console.log("Error marking messages as read:", err?.message);
      // local DB already updated; caller may choose to retry server later
      return { success: false, error: err?.message || "Unknown error" };
    }
  },

  /**
   * Mark single message as read
   * @param {string} messageID
   */
  markMessageAsRead: async (messageID) => {
    try {
      // Update local DB first for immediate UI
      await DatabaseService.updateMessageReadStatus(messageID, 1);

      // Update server
      await axios.post(
        `${process.env.EXPO_PUBLIC_API_BASE_URL}/api/v1/chats/mark-seen`,
        { messageID }
      );

      return { success: true, error: null };
    } catch (err) {
      console.error("Error marking message as seen", err);
      return { success: false, error: err?.message || "Unknown error" };
    }
  },
};
