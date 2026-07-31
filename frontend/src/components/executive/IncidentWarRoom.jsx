import React, { useState, memo } from "react";

const IncidentWarRoom = memo(function IncidentWarRoom({ messages = [], onSendMessage }) {
  const [inputText, setInputText] = useState("");
  const [messageType, setMessageType] = useState("ENGINEER");

  const defaultMessages = [
    { id: 1, sender_name: "System Monitoring", sender_department: "AIOps Engine", message_type: "SYSTEM", content: "🚨 WAR ROOM ACTIVATED: Critical Latency Alert triggered on Payment Webhook API.", created_at: "10:14 AM" },
    { id: 2, sender_name: "Gemini AI Assistant", sender_department: "AI Intelligence", message_type: "AI", content: "🤖 AI Analysis: Root cause identified as PgBouncer connection pool starvation (88% saturation). Recommended action: Scale replica pods to 12.", created_at: "10:15 AM" },
    { id: 3, sender_name: "Alex Rivera", sender_department: "IT Infrastructure", message_type: "ENGINEER", content: "I'm looking into the DB connection pool metrics right now. Applying temporary query buffer increase.", created_at: "10:18 AM" },
    { id: 4, sender_name: "Sarah Jenkins", sender_department: "Executive", message_type: "MANAGER", content: "Thanks Alex. @Elena Rostova, please verify if Auth rate limits are contributing to the connection surge.", created_at: "10:20 AM" },
  ];

  const chatStream = messages.length > 0 ? messages : defaultMessages;

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (onSendMessage) {
      onSendMessage({
        sender_name: "Sarah Jenkins",
        sender_department: "Executive",
        message_type: messageType,
        content: inputText,
      });
    }
    setInputText("");
  };

  return (
    <div className="panel incident-war-room-panel">
      <div className="panel-header">
        <div>
          <h2>🚨 Live Incident War Room Discussion</h2>
          <p>Real-time collaborative channel for executives, engineers, and AI assistants responding to active critical alerts.</p>
        </div>
        <span className="live-pill">● LIVE WAR ROOM</span>
      </div>

      <div className="warroom-messages-stream">
        {chatStream.map((msg) => {
          const typeLower = (msg.message_type || "ENGINEER").toLowerCase();
          return (
            <div key={msg.id} className={`warroom-msg-card type-${typeLower}`}>
              <div className="msg-header">
                <div className="sender-avatar">{msg.sender_name.charAt(0)}</div>
                <strong className="sender-name">{msg.sender_name}</strong>
                <span className="sender-dept">({msg.sender_department})</span>
                <span className={`msg-type-badge type-${typeLower}`}>{msg.message_type}</span>
                <span className="msg-time">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>

              <p className="msg-content">{msg.content}</p>
            </div>
          );
        })}
      </div>

      <form className="warroom-input-form" onSubmit={handleSend}>
        <select className="msg-type-select" value={messageType} onChange={(e) => setMessageType(e.target.value)}>
          <option value="ENGINEER">Engineer</option>
          <option value="MANAGER">Manager</option>
          <option value="SYSTEM">System</option>
        </select>

        <input
          type="text"
          className="warroom-input-field"
          placeholder="Type message, mention @user, or post update..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />

        <button type="submit" className="primary-button">Send Message</button>
      </form>
    </div>
  );
});

export default IncidentWarRoom;
