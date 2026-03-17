// socket.js
import { io } from "socket.io-client";

// Replace with your backend URL
const SOCKET_URL = `${process.env.EXPO_PUBLIC_API_SOCKET_URL}`;

const socket = io(SOCKET_URL, {
  transports: ["websocket"],
  reconnection: true,
  autoConnect: false,
});

export default socket;
