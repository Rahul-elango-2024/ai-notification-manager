const pool = require("../db");

exports.getChatUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, department, role, avatar_url, online_status, last_seen 
       FROM users 
       WHERE is_active = true
       ORDER BY online_status DESC, name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching chat users:", err);
    res.status(500).json({ error: "Failed to fetch chat users" });
  }
};

exports.getUserRooms = async (req, res) => {
  try {
    // We assume user_id is passed as query param for this mock, since auth might not be fully wired on frontend requests
    const userId = req.query.user_id || 1; // Fallback to 1

    const result = await pool.query(
      `SELECT r.id, r.type, r.name, r.department, 
              (SELECT COUNT(*) FROM chat_messages cm WHERE cm.room_id = r.id AND cm.created_at > cp.last_read_at) as unread_count,
              (SELECT content FROM chat_messages cm WHERE cm.room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message,
              (SELECT created_at FROM chat_messages cm WHERE cm.room_id = r.id ORDER BY created_at DESC LIMIT 1) as last_message_time
       FROM chat_rooms r
       JOIN chat_participants cp ON r.id = cp.room_id
       WHERE cp.user_id = $1
       ORDER BY last_message_time DESC NULLS LAST`,
      [userId]
    );

    // For direct chats, fetch the other participant's details
    for (let room of result.rows) {
      if (room.type === 'DIRECT') {
        const otherParticipant = await pool.query(
          `SELECT u.id, u.name, u.role, u.department, u.avatar_url, u.online_status, u.last_seen
           FROM chat_participants cp
           JOIN users u ON cp.user_id = u.id
           WHERE cp.room_id = $1 AND cp.user_id != $2`,
          [room.id, userId]
        );
        if (otherParticipant.rows.length > 0) {
          room.other_participant = otherParticipant.rows[0];
          room.name = room.other_participant.name;
        }
      }
    }

    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching user rooms:", err);
    res.status(500).json({ error: "Failed to fetch user rooms" });
  }
};

exports.createRoom = async (req, res) => {
  try {
    const { type, name, department, participantIds } = req.body;
    
    if (type === 'DIRECT' && participantIds.length === 2) {
      // Check if a direct room already exists
      const existing = await pool.query(
        `SELECT r.id FROM chat_rooms r
         JOIN chat_participants p1 ON r.id = p1.room_id AND p1.user_id = $1
         JOIN chat_participants p2 ON r.id = p2.room_id AND p2.user_id = $2
         WHERE r.type = 'DIRECT'`,
        [participantIds[0], participantIds[1]]
      );
      if (existing.rows.length > 0) {
        return res.json({ id: existing.rows[0].id });
      }
    }

    const roomRes = await pool.query(
      `INSERT INTO chat_rooms (type, name, department) VALUES ($1, $2, $3) RETURNING id`,
      [type, name || null, department || null]
    );
    const roomId = roomRes.rows[0].id;

    for (const uid of participantIds) {
      await pool.query(
        `INSERT INTO chat_participants (room_id, user_id) VALUES ($1, $2)`,
        [roomId, uid]
      );
    }

    res.status(201).json({ id: roomId });
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ error: "Failed to create room" });
  }
};

exports.getRoomMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await pool.query(
      `SELECT m.id, m.sender_id, m.message_type, m.content, m.attachments, m.created_at,
              u.name as sender_name, u.role as sender_role, u.department as sender_department, u.avatar_url
       FROM chat_messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.room_id = $1
       ORDER BY m.created_at ASC`,
      [roomId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching room messages:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { sender_id, message_type, content, attachments } = req.body;

    const result = await pool.query(
      `INSERT INTO chat_messages (room_id, sender_id, message_type, content, attachments)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, created_at`,
      [roomId, sender_id || null, message_type || 'USER', content, attachments ? JSON.stringify(attachments) : null]
    );

    const insertedMsg = result.rows[0];

    // If Gemini is mentioned, we can optionally trigger an AI response here or in Socket.js
    // For now, we will handle Gemini AI trigger inside the Socket.io logic to keep the API fast.

    res.status(201).json(insertedMsg);
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
};

exports.markRoomAsRead = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { user_id } = req.body;

    await pool.query(
      `UPDATE chat_participants SET last_read_at = CURRENT_TIMESTAMP WHERE room_id = $1 AND user_id = $2`,
      [roomId, user_id]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Error marking room as read:", err);
    res.status(500).json({ error: "Failed to update read status" });
  }
};
