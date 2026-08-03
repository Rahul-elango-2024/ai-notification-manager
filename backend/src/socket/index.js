const { Server } = require("socket.io");
const pool = require("../db");

let io;

const initializeSocket = (httpServer, app) => {
  io = new Server(httpServer, {
    cors: {
      origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
      methods: ["GET", "POST", "PUT", "DELETE"],
    },
  });

  app.set("io", io);

  const userSocketMap = new Map();

  io.on("connection", (socket) => {
    console.log("Client Connected", socket.id);

    // 1. Presence / Online Status
    socket.on("user_online", async ({ userId }) => {
      userSocketMap.set(socket.id, userId);
      socket.join(`user_${userId}`);
      try {
        await pool.query(`UPDATE users SET online_status = 'online' WHERE id = $1`, [userId]);
        io.emit("presence_update", { userId, status: 'online' });
      } catch (e) {
        console.error("Error setting user online:", e);
      }
    });

    // 2. Room Joining
    socket.on("join_room", ({ roomId }) => {
      socket.join(`room_${roomId}`);
      console.log(`Socket ${socket.id} joined room_${roomId}`);
    });

    socket.on("leave_room", ({ roomId }) => {
      socket.leave(`room_${roomId}`);
    });

    // 3. Typing Indicator
    socket.on("typing", ({ roomId, userId, name }) => {
      socket.to(`room_${roomId}`).emit("user_typing", { roomId, userId, name });
    });

    // 4. Send Message & AI Logic
    socket.on("send_message", async (data) => {
      // Find all participants of the room to broadcast individually
      try {
        const parts = await pool.query(`SELECT user_id FROM chat_participants WHERE room_id = $1`, [data.roomId]);
        parts.rows.forEach(p => {
          io.to(`user_${p.user_id}`).emit("new_message", data);
        });
      } catch (e) {
        console.error("Error fetching participants for broadcast:", e);
        // Fallback
        io.to(`room_${data.roomId}`).emit("new_message", data);
      }

      // Check if Gemini is mentioned
      if (data.content && data.content.toLowerCase().includes("@gemini")) {
        // Send AI thinking state
        io.to(`room_${data.roomId}`).emit("user_typing", { roomId: data.roomId, userId: 'ai', name: 'Gemini AI Assistant' });
        
        setTimeout(async () => {
          // Generate Structured Card for AI
          const aiMessage = {
            roomId: data.roomId,
            sender_id: null,
            sender_name: "Gemini AI Assistant",
            sender_role: "Intelligence",
            sender_department: "AIOps",
            message_type: "AI",
            content: "Analysis Complete.",
            attachments: {
              cardType: "AI_RECOMMENDATION",
              rootCause: "Database connection pool exhausted due to sudden spike in API requests.",
              confidence: 96.5,
              recommendation: "Auto-scale the database cluster and temporarily throttle rate limits.",
              actions: ["View Details", "Approve & Execute"]
            },
            created_at: new Date().toISOString(),
          };

          try {
            // Persist AI message
            const res = await pool.query(
              `INSERT INTO chat_messages (room_id, sender_id, message_type, content, attachments)
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [aiMessage.roomId, null, aiMessage.message_type, aiMessage.content, JSON.stringify(aiMessage.attachments)]
            );
            aiMessage.id = res.rows[0].id;
            
            // Broadcast AI message to all participants
            const parts = await pool.query(`SELECT user_id FROM chat_participants WHERE room_id = $1`, [data.roomId]);
            parts.rows.forEach(p => {
              io.to(`user_${p.user_id}`).emit("new_message", aiMessage);
            });
          } catch (e) {
            console.error("Error persisting AI message:", e);
          }
        }, 2500); // Simulate processing delay
      }
    });

    // 5. Read Receipts
    socket.on("mark_read", async ({ roomId, userId }) => {
      socket.to(`room_${roomId}`).emit("message_read", { roomId, userId, time: new Date() });
    });

    // Disconnect
    socket.on("disconnect", async () => {
      console.log("Client Disconnected", socket.id);
      const userId = userSocketMap.get(socket.id);
      if (userId) {
        userSocketMap.delete(socket.id);
        try {
          await pool.query(`UPDATE users SET online_status = 'offline', last_seen = CURRENT_TIMESTAMP WHERE id = $1`, [userId]);
          io.emit("presence_update", { userId, status: 'offline', last_seen: new Date() });
        } catch (e) {
          console.error("Error setting user offline:", e);
        }
      }
    });
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized!");
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIo,
};
