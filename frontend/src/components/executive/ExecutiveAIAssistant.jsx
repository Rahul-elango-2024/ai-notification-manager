import React, { useState, useRef, useEffect, memo } from "react";

const ExecutiveAIAssistant = memo(function ExecutiveAIAssistant() {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Enterprise AI Assistant online. Ask about system status, incidents, SLAs, performance, deployments, or type 'help' to see all available topics." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [prompts, setPrompts] = useState([
    "System Status",
    "Explain Incident",
    "Generate Summary",
    "Help",
  ]);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const newMsgs = [...messages, { sender: "user", text: query }];
    setMessages(newMsgs);
    if (!textToSend) setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: query, conversationHistory: newMsgs }),
      });

      if (!res.ok) throw new Error("AI request failed");
      const data = await res.json();
      setMessages((prev) => [...prev, { sender: "ai", text: data.response || "No response received." }]);

      // Update suggested prompts from AI response
      if (data.suggestedActions && data.suggestedActions.length > 0) {
        setPrompts(data.suggestedActions);
      }
    } catch (err) {
      console.error("AI Error:", err);
      setMessages((prev) => [...prev, { sender: "ai", text: "Unable to reach AI service. Please check the backend connection." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-card ai-assistant-panel">
      <div className="section-card-header">
        <h2 className="section-title">AI Assistant</h2>
        <span className="badge badge-primary">Enterprise</span>
      </div>

      <div className="ai-chat-stream" ref={chatContainerRef}>
        {messages.map((m, idx) => (
          <div key={idx} className={`chat-message-row ${m.sender}`}>
            <div className="chat-bubble">
              <p>{m.text}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-message-row ai">
            <div className="chat-bubble">
              <p>Analyzing...</p>
            </div>
          </div>
        )}
      </div>

      <div className="prompt-buttons-group">
        {prompts.map((prompt, idx) => (
          <button key={idx} className="chip-button" onClick={() => handleSend(prompt)} disabled={loading}>
            {prompt}
          </button>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          className="form-input"
          placeholder="Ask anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <button className="primary-button" onClick={() => handleSend()} disabled={loading}>
          {loading ? "..." : "Send"}
        </button>
      </div>
    </div>
  );
});

export default ExecutiveAIAssistant;

