// src/modules/socketManager.js
const { Server } = require('socket.io');
const chatUseCases = require('../controllers/chats/chatUseCase');
const moment = require('moment');
const notification = require('./notification');

let io;
const onlineUsers = {}; // key: userID, value: socket.id
const activeCalls = {};

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*' // Allow all or restrict based on your frontend origin
    }
  });
  // Loaded socket.io
  console.log('Socket.io loaded');

  io.on('connection', (socket) => {
    console.log('️‍🔥 Socket connected:', socket.id);

    // Join a chat room
    socket.on('joinRoom', ({ chatID }) => {
      socket.join(chatID);
      console.log(`🧲 Socket ${socket.id} joined room: ${chatID}`);
    });

    socket.on('set-online', ({ userID }) => {
      if (!userID) return;
      socket.join(`user_${userID}`);
      onlineUsers[userID] = socket.id;
      // notify all online users

      onlineUsers && Object.entries(onlineUsers).forEach(([key, value]) => {
        io.to(value).emit('userOnline', { userID, checkerUserID: key, onlineStatus: 1 });
      })
      console.log(`🧲🧲🧲 Socket ${socket.id} is Online with-userID ${userID}`);
    });

    // Join a personal room [ChatList]
    socket.on('joinChatList', ({ userID }) => {
      if (userID) {
        socket.join(`user_${userID}`);
        onlineUsers[userID] = socket.id;
        console.log(`🧲 User ${userID} connected to ChatList: user_${userID}`);
      }
    });

    socket.on('leaveRoom', ({ chatID }) => {
      if (chatID) {
        socket.leave(chatID);
        console.log(`⛓️‍💥 Socket ${socket.id} left room: ${chatID}`);
      }
    });

    socket.on('seenThisMessage', async ({ messageID, chatID, userID }) => {
      console.log(`✌️ Msg ${messageID} seen by user ${userID} in chat ${chatID}`);
      socket.to(chatID).emit('messageSeen', { messageID, chatID, userID });
      // UpdateDatabase
      await chatUseCases.markMessageAsSeenByID({ messageID, chatID, userID });
    });
    socket.on('readMessage', async ({ messageID, chatID, userID }) => {
      console.log(`✌️ Msg ${messageID} read by user ${userID} in chat ${chatID}`);
      socket.to(chatID).emit('messageReadAll', { messageID, chatID, userID });
      // UpdateDatabase

      await chatUseCases.markAllPreviousReadByReceiverID({ chatID, receiverID: userID });
    });

    socket.on('sendMessage', async (data) => {
      try {
        var messageID = data.messageID || null;
        console.log(data);

        if (!data.messageID) {
          const result = await chatUseCases.sendMessage(data);
          console.log(result);

          if (result.success) {
            messageID = result.data[0].messageID;
          } else {
            socket.emit('errorMessage', result.message);
            return;
          }
        }

        const message = {
          messageID: messageID,
          ...data,
          timestamp: moment().format('YYYY-MM-DD HH:mm:ss')
        };

        socket.to(data.chatID).emit('newMessage', message);
        socket.emit('messageSent', message); // Confirm to the sender

        const chatMembers = await chatUseCases.getChatParticipants({ chatID: data.chatID });

        if (chatMembers.success) {
          chatMembers.data.forEach((member) => {
            if (member.userID !== data.senderID) {
              const recipientSocketId = onlineUsers[member.userID];
              console.log('recipientSocketId', recipientSocketId);
              if (recipientSocketId) {
                console.log('Sended via socket');

                socket.to(`user_${member.userID}`).emit('chatListUpdate', message);
              } else {
                // ❗ User is offline — send push notification
                console.log('sended via Notif');

                notification.push({
                  title: 'New Message',
                  body: `${message.message ? message.message : 'You have a new message'}`,
                  userID: member.userID,
                  data: { chatID: data.chatID, messageID, senderID: data.senderID, receiverID: member.userID }
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('errorMessage', 'An error occurred while sending the message.');
      }
    });

    // Optional: handle typing indicator
    socket.on('typing', ({ chatID, userID }) => {
      socket.to(chatID).emit('typing', { userID });
    });

    socket.on('stopTyping', ({ chatID, userID }) => {
      socket.to(chatID).emit('stopTyping', { userID });
    });

    // Handle msg seen
    socket.on('messageSeen', async (data) => {
      try {
        await chatUseCases.markMessageAsSeen(data);
        console.log('Message seen:', data.messageID);
      } catch (error) {
        console.error('Error marking message as seen:', error);
      }
    });

    // HAndle Online Status
    socket.on('check-online', (data) => {
      // Check in list
      const { userID, checkerUserID } = data;
      console.log("Checking Online Status", data);

      const onlineStatus = onlineUsers[userID] ? 1 : 0;
      console.log(onlineUsers, onlineUsers[checkerUserID]);

      io.to(onlineUsers[checkerUserID]).emit('status-received', { userID, checkerUserID, onlineStatus });
    })
    // Video Call Modules..
    socket.on('start-call', (data) => {
      const { to, from, chatID, userName } = data;
      console.log(`🚨🎬 data`, data);

      const recipientSocketId = onlineUsers[to];
      activeCalls[from] = to;
      activeCalls[to] = from;
      if (recipientSocketId) {
        console.log(`🚨🎬incoming-call send to ${userName}`);

        io.to(recipientSocketId).emit('incoming-call', { from, chatID, userName });
      } else {
        io.to(onlineUsers[from]).emit('call-unavailable');
      }
    });


    socket.on('accept-call', ({ to, from }) => {
      console.log(`🚨🎬 ${to} get accepted call from ${to}`);
      io.to(onlineUsers[to]).emit('call-accepted', { to, from });
    });

    socket.on('reject-call', ({ to }) => {
      console.log(`🚨🎬 ${to} get rejected call`);
      io.to(onlineUsers[to]).emit('call-rejected');
    });

    // Signaling for video call
    socket.on("send-offer", (data) => {
      const { from, to } = data;
      if (onlineUsers[to]) {
        try {
          io.to(onlineUsers[to]).emit("offer", data);
        } catch (error) { }
      } else {
        console.log("User not found", onlineUsers);
      }
    });

    socket.on("offer", (data) => {
      const { from, to, offer } = data;

      if (onlineUsers[to]) {
        io.to(to).emit("incomming-videocall", { from: onlineUsers[from] });
      }
      if (!onlineUsers[from]) {
        onlineUsers[from] = { username: from, id: socket.id, status: "busy" };
      } else if (!onlineUsers[to]) {
        io.to(onlineUsers[from]).emit("error", {
          message: "User not ready please wait...",
        });
        return;

      } else {
        onlineUsers[to].status = "busy";
        console.log("Offer send to:", onlineUsers[to], "from", from);
        try {
          io.to(onlineUsers[to]).emit("offer", { from, to, offer });
        } catch (error) { }
      }
    });
    socket.on("icecandidate", ({ candidate, to }) => {
      if (onlineUsers[to]) {
        try {
          io.to(onlineUsers[to]).emit("icecandidate", candidate);
        } catch (error) {
          console.log("icecandidate error", error);
        }
      }
      // socket.broadcast.emit("icecandidate", candidate);
    });

    socket.on("answer", (data) => {
      const { from, to, answer } = data;
      console.log("Answer send to:", onlineUsers[from], "from", to);

      io.to(onlineUsers[from]).emit("answer", { from, to, answer });
      // socket.to(from).emit("answer", data); // Send answer to the specified user
    });

    socket.on("candidate", (data) => {
      // Emit the candidate with the correct structure
      const { candidate, to } = data;
      if (onlineUsers[to]) {
        try {
          io.to(onlineUsers[to]).emit("candidate", { candidate });
        } catch (error) { }
      } else {
        console.log("User not found for candidate:", to);
      }
    });

    // user-video-call-disconnect
    socket.on("user-video-call-disconnect", (data) => {
      const { from, to } = data;
      if (onlineUsers[to]) {
        try {
          // onlineUsers[to].status = "online";
          io.to(onlineUsers[to]).emit("user-video-call-disconnect", data);
          io.to(onlineUsers[to]).emit("call-ended", data);
          io.to(onlineUsers[to]).emit("incoming-call-disconnected", data);
        } catch (error) {
          console.log("user-video-call-disconnect error", error);
        }
      } else {
        console.log("User not found for disconnect:", to);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      const userID = Object.entries(onlineUsers).find(([key, value]) => value === socket.id)?.[0] || null;
      Object.entries(onlineUsers).forEach(([key, value]) => io.to(value).emit('status-received', { userID, checkerUserID: key, onlineStatus: 0 }));

      // End all active calls for this user
      for (const [caller, data] of Object.entries(activeCalls)) {
        if (onlineUsers[caller] === socket.id || (data.to && onlineUsers[data.to] === socket.id)) {
          io.to(onlineUsers[data.to || caller]).emit('call-ended', { reason: 'disconnected' });
          io.to(onlineUsers[data.to || caller]).emit('incoming-call-disconnected', { reason: 'disconnected' });
          io.to(onlineUsers[data.to || caller]).emit('user-video-call-disconnect', { reason: 'disconnected' });
          delete activeCalls[caller];
        }
      }
      for (const userID in onlineUsers) {
        if (onlineUsers[userID] === socket.id) {
          delete onlineUsers[userID];
          break;
        }
      }
    });
  });
};

// ✅ Getter function
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized yet!");
  }
  return io;
};

module.exports = { initializeSocket, getIO };
