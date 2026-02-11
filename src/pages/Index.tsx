import { useState } from "react";
import { Send, Bot, User, ExternalLink, ArrowLeft, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "assistant" | "user";
  text: string;
  sources?: { label: string; url: string }[];
}

const suggestedQuestions = [
  "What does my deductible mean?",
  "How do I find an in-network doctor?",
  "What's the difference between a co-pay and coinsurance?",
  "How do I schedule a wellness visit?",
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Welcome, Chad! 👋 I'm your Easy Health assistant. I can help you understand your insurance, find doctors, or navigate your health benefits. What would you like to know?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input };
    setMessages((prev) => [
      ...prev,
      userMsg,
      {
        role: "assistant",
        text: `Based on the information you shared, here's what I found:\n\nYour current plan covers preventive care visits at no additional cost. For specialist visits, you'll have a $30 co-pay after meeting your $500 deductible.\n\nI'd recommend scheduling a check-up with Dr. Carsonian at InterHills Health — they're in-network and have availability next week.`,
        sources: [
          { label: "CDC – Preventive Care", url: "https://www.cdc.gov/" },
          { label: "Healthcare.gov – Glossary", url: "https://www.healthcare.gov/" },
        ],
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
      {/* Start Here Banner */}
      {messages.length <= 1 && (
        <div className="p-4 animate-slide-up">
          <div className="rounded-xl bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-secondary-foreground">Start Here, Chad</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Not sure where to begin? Try one of these common questions or type your own below.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    setInput(q);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-border/50 space-y-1">
                  <span className="text-xs font-medium text-muted-foreground">Sources:</span>
                  {msg.sources.map((s, j) => (
                    <a
                      key={j}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card/60 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about your health plan..."
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button size="icon" onClick={handleSend} className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
