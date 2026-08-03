import React, { useState, useEffect, useRef } from "react";
import { chatApi } from "../../services/chatApi";
import { authService } from "../../services/authService";
import socket from "../../services/socket";
import "./EnterpriseMessagingSystem.css";

export default function EnterpriseMessagingSystem() {
  const [users, setUsers] = useState([]);
  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState("");
  const [activeUser, setActiveUser] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});

  const messagesEndRef = useRef(null);
  // Default to a fallback user if not authenticated properly during testing
  const currentUser = authService.getCurrentUser() || { id: 1, fullName: "Admin User", department: "Executive" };

  useEffect(() => {
    loadUsers();

    socket.emit("user_online", { userId: currentUser.id });

    const handlePresence = (data) => {
      setUsers(prev => prev.map(u => u.id === data.userId ? { ...u, online_status: data.status, last_seen: data.last_seen } : u));
    };

    socket.on("presence_update", handlePresence);

    return () => {
      socket.off("presence_update", handlePresence);
    };
  }, []);

  useEffect(() => {
    if (!activeRoom) return;
    
    socket.emit("join_room", { roomId: activeRoom });

    const handleNewMessage = (msg) => {
      if (msg.roomId === activeRoom) {
        setMessages(prev => [...prev, msg]);
        scrollToBottom();
        
        // Mark as read
        chatApi.markAsRead(activeRoom, currentUser.id);
        socket.emit("mark_read", { roomId: activeRoom, userId: currentUser.id });
      } else if (msg.sender_id && msg.sender_id !== currentUser.id) {
        // Show unread indicator for the sender if we are not in their room
        setUnreadCounts(prev => ({
          ...prev,
          [msg.sender_id]: (prev[msg.sender_id] || 0) + 1
        }));
      }
    };

    const handleTyping = (data) => {
      if (data.roomId === activeRoom && data.userId !== currentUser.id) {
        setTypingUser(data.name);
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleRead = (data) => {
      // Implement read receipt logic (update messages state if needed)
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleTyping);
    socket.on("message_read", handleRead);

    return () => {
      socket.emit("leave_room", { roomId: activeRoom });
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("message_read", handleRead);
    };
  }, [activeRoom]);

  const loadUsers = async () => {
    try {
      const data = await chatApi.getUsers();
      // Filter out self
      setUsers(data.filter(u => u.id !== currentUser.id));
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const handleSelectUser = async (user) => {
    setActiveUser(user);
    // Clear unread indicator
    setUnreadCounts(prev => {
      const next = { ...prev };
      delete next[user.id];
      return next;
    });

    try {
      const room = await chatApi.createRoom('DIRECT', null, null, [currentUser.id, user.id]);
      setActiveRoom(room.id);
      
      const msgs = await chatApi.getMessages(room.id);
      setMessages(msgs);
      scrollToBottom();
      
      chatApi.markAsRead(room.id, currentUser.id);
    } catch (err) {
      console.error("Error setting up direct chat", err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !activeRoom) return;

    const payload = {
      roomId: activeRoom,
      sender_id: currentUser.id,
      sender_name: currentUser.fullName,
      message_type: "USER",
      content: inputValue,
    };

    setInputValue("");
    socket.emit("send_message", payload);

    try {
      await chatApi.sendMessage(activeRoom, payload);
    } catch (err) {
      console.error("Failed to persist message", err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const renderHighlightedText = (text, query) => {
    if (!query || typeof text !== 'string') return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? <mark key={i} className="search-highlight">{part}</mark> : part
    );
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="ems-container">
      {/* Left Sidebar */}
      <div className="ems-sidebar">
        <div className="ems-sidebar-header">
          <h3 className="ems-sidebar-title">Messaging</h3>
          <input 
            type="text" 
            className="ems-search-box" 
            placeholder="Search users or messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="ems-user-list">
          {filteredUsers.map(u => {
            const unreadCount = unreadCounts[u.id] || 0;
            return (
              <div 
                key={u.id} 
                className={`ems-user-item ${activeUser?.id === u.id ? 'active' : ''}`}
                onClick={() => handleSelectUser(u)}
              >
                <div className={`ems-unread-dot ${unreadCount > 0 ? 'visible' : ''}`}></div>
                <div className="ems-avatar-wrapper">
                  <div className="ems-avatar">{u.name.charAt(0)}</div>
                  <div className={`ems-status-indicator ${u.online_status === 'online' ? 'online' : 'offline'}`}></div>
                </div>
                <div className="ems-user-details">
                  <div className="ems-user-name-row">
                    <span className="ems-user-name">{renderHighlightedText(u.name, searchQuery)}</span>
                    {unreadCount > 0 && <span className="ems-unread-badge">{unreadCount}</span>}
                  </div>
                  <div className="ems-user-role-row">
                    <span className="ems-user-role">{u.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Center Chat Area */}
      {activeRoom ? (
        <div className="ems-chat-area">
          <div className="ems-chat-header">
            <div className="ems-avatar-wrapper" style={{ width: 36, height: 36, marginRight: 0 }}>
              <div className="ems-avatar">{activeUser?.name.charAt(0)}</div>
              <div className={`ems-status-indicator ${activeUser?.online_status === 'online' ? 'online' : 'offline'}`}></div>
            </div>
            <div className="ems-chat-header-info">
              <h2 className="ems-chat-title">{activeUser?.name}</h2>
              <p className="ems-chat-subtitle">{activeUser?.department} • {activeUser?.role}</p>
            </div>
          </div>

          <div className="ems-messages-container">
            {messages.map((msg, i) => {
              const isSelf = msg.sender_id === currentUser.id;
              const isAI = msg.message_type === "AI";

              let wrapperClass = "ems-message-wrapper others";
              if (isSelf) wrapperClass = "ems-message-wrapper self";
              if (isAI) wrapperClass = "ems-message-wrapper ai";

              // Check if AI Structured Card
              const attachments = typeof msg.attachments === 'string' ? JSON.parse(msg.attachments) : msg.attachments;
              const isAiCard = attachments && attachments.cardType === "AI_RECOMMENDATION";

              return (
                <div key={msg.id || i} className={wrapperClass}>
                  <div className="ems-message-header">
                    <span className="ems-message-sender">{msg.sender_name || (isSelf ? currentUser.fullName : activeUser?.name)}</span>
                    <span className="ems-message-time">
                      {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}
                    </span>
                  </div>
                  
                  {isAiCard ? (
                    <div className="ems-ai-card">
                      <div className="ems-ai-card-title">✨ AI Analysis Recommendation</div>
                      <div className="ems-ai-section">
                        <div className="ems-ai-label">Root Cause</div>
                        <div className="ems-ai-value">{attachments.rootCause}</div>
                      </div>
                      <div className="ems-ai-section">
                        <div className="ems-ai-label">Confidence</div>
                        <div className="ems-ai-value" style={{ color: "#34d399", fontWeight: "bold" }}>{attachments.confidence}%</div>
                      </div>
                      <div className="ems-ai-section">
                        <div className="ems-ai-label">Recommendation</div>
                        <div className="ems-ai-value">{attachments.recommendation}</div>
                      </div>
                      <div className="ems-ai-actions">
                        <button className="ems-ai-btn secondary">View Details</button>
                        <button className="ems-ai-btn primary">Approve & Execute</button>
                      </div>
                    </div>
                  ) : (
                    <div className="ems-message-bubble">
                      {renderHighlightedText(msg.content, searchQuery)}
                    </div>
                  )}
                  {isSelf && <div className="ems-read-receipt">✓ Delivered</div>}
                </div>
              );
            })}
            
            {isTyping && (
              <div className="ems-typing-indicator">
                {typingUser} is typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="ems-composer-area">
            <div className="ems-composer-inner">
              <button className="ems-icon-btn">📎</button>
              <textarea 
                className="ems-composer-input"
                placeholder="Type a message or use @Gemini for AI assistance..."
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  socket.emit("typing", { roomId: activeRoom, userId: currentUser.id, name: currentUser.fullName });
                }}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <div className="ems-composer-actions">
                <button className="ems-icon-btn">😊</button>
                <button className="ems-icon-btn">@</button>
                <button className="ems-send-btn" onClick={handleSend}>Send</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="ems-empty-state">
          Select a user to start messaging
        </div>
      )}
    </div>
  );
}
