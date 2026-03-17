const express = require("express");
const { chatController } = require('../controllers');

const {
  sendMessage,
  getChatList,
  getMessages,
  markAllPreviousReadByReceiverID,
  addUserToGroup,
  markMessageAsSeenByID,
  markMessagesAsReadByChatID,
  createNewChat
} = chatController();

const router = express.Router();

router.route("/new-chat").post(createNewChat);
router.route("/add-to-group").post(addUserToGroup);
router.route("/send-message").post(sendMessage);
router.route("/get-chat-list/:userID").get(getChatList);
router.route("/get-messages/:chatID").get(getMessages);
router.route("/mark-all-read").post(markAllPreviousReadByReceiverID);
router.route("/mark-seen").post(markMessageAsSeenByID); 
router.route("/mark-as-read").patch(markMessagesAsReadByChatID);

module.exports = router;
