import React, { useState, memo } from "react";

const AIChatInsightsDrawer = memo(function AIChatInsightsDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Hello! I am your Enterprise AIOps Assistant. Ask me anything about risk forecasts, anomalies, or system degradation." },
  ]);
  const [input, setInput] = useState("");

  const quickPrompts = [
    "Why is Finance risk increasing?",
    "Predict next week's incidents.",
    "Explain the payment anomaly.",
    "What should I do first?",
  ];

  const handleSend = (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const newMessages = [...messages, { sender: "user", text: query }];
    setMessages(newMessages);
    if (!textToSend) setInput("");

    setTimeout(() => {
      let aiResponse = "Analyzing active telemetry streams and predictive risk models...";
      const lower = query.toLowerCase();

      if (lower.includes("finance")) {
        aiResponse = "Finance risk is elevated to 78/100 primarily due to a 940ms latency anomaly in the Payment Webhook processing pipeline, threatening SLA thresholds.";
      } else if (lower.includes("next week") || lower.includes("predict")) {
        aiResponse = "Models forecast 14 incidents next week, peaking on Thursday during end-of-month reconciliation. Estimated DB pool saturation probability is 94%.";
      } else if (lower.includes("anomaly") || lower.includes("payment")) {
        aiResponse = "The payment anomaly exhibits 96.4% confidence pattern matching. Webhook workers are operating at max capacity under heavy payload throughput.";
      } else if (lower.includes("first") || lower.includes("do")) {
        aiResponse = "Priority 1 Action: Increase PgBouncer connection pool limits to 250, then scale Payment Webhook replica pods from 4 to 12.";
      } else {
        aiResponse = `Based on current telemetry, system health is 94.2%. Operational parameters for ${query} remain monitored with high AI confidence.`;
      }

      setMessages((prev) => [...prev, { sender: "ai", text: aiResponse }]);
    }, 600);
  };

  if (!isOpen) return null;

  return (
    <div className="ai-chat-overlay" onClick={onClose}>
      <div className="ai-chat-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="ai-chat-header">
          <div>
            <h3>💬 AIOps Chat Assistant</h3>
            <span>Powered by Gemini Operational Intelligence</span>
          </div>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="ai-chat-messages">
          {messages.map((msg, idx) => (
            <div key={idx} className={`chat-message ${msg.sender}`}>
              <div className="chat-avatar">{msg.sender === "ai" ? "🤖" : "👤"}</div>
              <div className="chat-bubble"><p>{msg.text}</p></div>
            </div>
          ))}
        </div>

        <div className="quick-prompts-bar">
          <span className="qp-label">Quick Prompts:</span>
          <div className="qp-list">
            {quickPrompts.map((prompt, idx) => (
              <button key={idx} className="qp-btn" onClick={() => handleSend(prompt)}>
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="ai-chat-input-bar">
          <input
            type="text"
            placeholder="Ask AIOps Assistant about risks or metrics..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button className="primary-button" onClick={() => handleSend()}>Send</button>
        </div>
      </div>
    </div>
  );
});

export default AIChatInsightsDrawer;
