import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// A single shared connection for the entire SPA. Components attach/detach only
// their own listeners; none of them owns or disconnects this socket.
const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

export function getSocket() {
  if (!socket.connected) socket.connect();
  return socket;
}

export default socket;
