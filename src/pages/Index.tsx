import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ExternalLink, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { fetchChatUserContext, type ChatUserProfile } from "@/lib/chatUserContext";
import { buildChatSystemPromptAtRequest } from "@/lib/chatSystemPrompt";

interface Message {
  role: "assistant" | "user";
  text: string;
  sources?: { label: string; url: string }[];
}

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

const GENERIC_WELCOME =
  "Welcome! I'm your Easy Health assistant. I can help you understand your insurance, find doctors, or navigate your health benefits. What would you like to know?";

const suggestedQuestions = [
  "What does my deductible mean?",
  "How do I find an in-network doctor?",
  "What's the difference between a co-pay and coinsurance?",
  "How do I schedule a wellness visit?",
];

const Index = () => {
  const { user, initializing } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: GENERIC_WELCOME,
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<ChatUserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (initializing) {
      return;
    }

    if (!user) {
      setUserProfile(null);
      setMessages([{ role: "assistant", text: GENERIC_WELCOME, sources: [] }]);
      return;
    }

    if (user.role === "admin") {
      return;
    }

    let cancelled = false;

    void fetchChatUserContext(user.user_id).then((profile) => {
      if (cancelled) {
        return;
      }
      setUserProfile(profile);
      const first = profile?.firstName ?? user.first_name;
      setMessages([
        {
          role: "assistant",
          text: `Welcome, ${first}! I'm your Easy Health assistant. I can help you understand your insurance, find doctors, or navigate your health benefits. What would you like to know?`,
          sources: [],
        },
      ]);
    });

    return () => {
      cancelled = true;
    };
  }, [initializing, user]);

  const displayName = userProfile?.firstName ?? user?.first_name;

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isLoading) {
      return;
    }

    const userMsg: Message = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const apiHistory: ApiMessage[] = updatedMessages
      .slice(1)
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const systemPrompt = buildChatSystemPromptAtRequest({
        authUser: user,
        profile: userProfile,
      });

      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: systemPrompt,
          messages: apiHistory,
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const replyText =
        data.content
          ?.filter((block: { type: string }) => block.type === "text")
          .map((block: { text: string }) => block.text)
          .join("\n") ??
        "Sorry, I couldn't generate a response. Please try again.";

      const assistantMsg: Message = {
        role: "assistant",
        text: replyText,
        sources: [],
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("Claude API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I'm having trouble connecting right now. Please try again in a moment, or contact your plan's member services for immediate help.",
          sources: [],
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] max-w-2xl flex-col mx-auto">
      {messages.length <= 1 && (
        <div className="animate-slide-up p-4">
          <div className="rounded-xl bg-secondary p-5">
            <div className="mb-2 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h2 className="font-semibold text-secondary-foreground">
                Start Here{displayName ? `, ${displayName}` : ""}
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground">
              Not sure where to begin? Try one of these common questions or type your own below.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex animate-fade-in gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-card-foreground"
              }`}
            >
              <p className="whitespace-pre-line">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-border/50 pt-2">
                  <span className="text-xs font-medium text-muted-foreground">Sources:</span>
                  {msg.sources.map((s, j) => (
                    <a
                      key={j}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {s.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent">
                <User className="h-4 w-4 text-accent-foreground" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex animate-fade-in gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary">
              <Bot className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border bg-card/60 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about your health plan..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button size="icon" onClick={() => handleSend()} disabled={isLoading || !input.trim()} className="shrink-0">
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
