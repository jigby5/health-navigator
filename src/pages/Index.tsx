import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, ExternalLink, Lightbulb, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "assistant" | "user";
  text: string;
  sources?: { label: string; url: string }[];
}

// Maps to the Anthropic messages API shape
interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  planType: string;
  providerName: string;
  networkType: string;
  copayAmount: number;
  remainingBalance: number;
  totalBalanceDue: number;
  doctors: { name: string; specialty: string; facility: string }[];
  upcomingAppointments: {
    dateTime: string;
    doctorName: string;
    facility: string;
  }[];
}

// Fixed user ID for Chad (the demo user)
const CHAD_USER_ID = 1;

const BASE_SYSTEM_PROMPT = `You are Easy Health Assistant, a friendly and knowledgeable health insurance guide embedded in the Easy Health app.

Your expertise covers:
- Health insurance concepts: deductibles, copays, coinsurance, out-of-pocket maximums, premiums, in-network vs out-of-network
- How to use benefits: preventive care, specialist referrals, urgent care vs ER decisions
- Finding and scheduling care: primary care, specialists, telehealth
- Claims and billing: how to read an EOB, dispute a claim, understand a medical bill
- Plan types: HMO, PPO, EPO, HDHP, FSA, HSA

Guidelines:
- Always explain things in plain, non-technical language
- Be warm, reassuring, and patient — health insurance is confusing for most people
- Give specific, actionable answers
- When relevant, reference the user's specific plan details provided below
- If asked about something outside health insurance/healthcare, gently redirect
- Keep responses concise (2-4 paragraphs max) and easy to scan
- Do NOT recommend specific medications or diagnose medical conditions
- Always suggest consulting a doctor or plan representative for complex medical/coverage decisions`;

const buildSystemPrompt = (profile: UserProfile | null): string => {
  if (!profile) return BASE_SYSTEM_PROMPT;

  const doctorList = profile.doctors
    .map((d) => `  - ${d.name} (${d.specialty}) at ${d.facility}`)
    .join("\n");

  const apptList = profile.upcomingAppointments.length
    ? profile.upcomingAppointments
        .map(
          (a) =>
            `  - ${new Date(a.dateTime).toLocaleDateString()} with ${a.doctorName} at ${a.facility}`,
        )
        .join("\n")
    : "  - No upcoming appointments";

  return `${BASE_SYSTEM_PROMPT}

${profile.firstName}'s current account details (use these to give personalized answers):
- Name: ${profile.firstName} ${profile.lastName}
- Insurance Provider: ${profile.providerName} (${profile.networkType})
- Plan Type: ${profile.planType}
- Copay Amount: $${profile.copayAmount}
- Remaining Balance: $${profile.remainingBalance}
- Total Balance Due: $${profile.totalBalanceDue}

In-Network Doctors:
${doctorList || "  - None on file"}

Upcoming Appointments:
${apptList}`;
};

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
      text: "Welcome! 👋 I'm your Easy Health assistant. I can help you understand your insurance, find doctors, or navigate your health benefits. What would you like to know?",
      sources: [],
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch user profile from Supabase on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Fetch user + insurance plan + insurance provider
        const { data: userData } = await supabase
          .from("users")
          .select(
            `
            first_name,
            last_name,
            total_balance_due,
            total_copay_amounts,
            insurance_plans (
              copay_amount,
              remaining_balance,
              policy_type,
              insurance_providers (
                name,
                network_type
              )
            )
          `,
          )
          .eq("user_id", CHAD_USER_ID)
          .single();

        // Fetch insurance provider ID for network lookup
        const { data: planData } = await supabase
          .from("insurance_plans")
          .select("provider_id")
          .eq("user_id", CHAD_USER_ID)
          .single();

        let doctors: UserProfile["doctors"] = [];
        if (planData?.provider_id) {
          const { data: networkData } = await supabase
            .from("provider_network")
            .select(
              `
              healthcare_providers (
                full_name,
                specialty,
                facility_name
              )
            `,
            )
            .eq("insurance_provider_id", planData.provider_id);

          doctors =
            networkData?.map((n: any) => ({
              name: n.healthcare_providers.full_name,
              specialty: n.healthcare_providers.specialty,
              facility: n.healthcare_providers.facility_name,
            })) ?? [];
        }

        // Fetch upcoming appointments
        const { data: apptData } = await supabase
          .from("appointments")
          .select(
            `
            date_time,
            healthcare_providers (
              full_name,
              facility_name
            )
          `,
          )
          .eq("user_id", CHAD_USER_ID)
          .eq("status", "scheduled")
          .gte("date_time", new Date().toISOString())
          .order("date_time", { ascending: true })
          .limit(3);

        const upcomingAppointments =
          apptData?.map((a: any) => ({
            dateTime: a.date_time,
            doctorName: a.healthcare_providers.full_name,
            facility: a.healthcare_providers.facility_name,
          })) ?? [];

        if (userData) {
          const plan = (userData as any).insurance_plans?.[0];
          const provider = plan?.insurance_providers;

          const profile: UserProfile = {
            firstName: userData.first_name,
            lastName: userData.last_name,
            planType: plan?.policy_type ?? "Unknown",
            providerName: provider?.name ?? "Unknown",
            networkType: provider?.network_type ?? "Unknown",
            copayAmount: plan?.copay_amount ?? 0,
            remainingBalance: plan?.remaining_balance ?? 0,
            totalBalanceDue: userData.total_balance_due ?? 0,
            doctors,
            upcomingAppointments,
          };

          setUserProfile(profile);

          // Update welcome message with user's first name
          setMessages([
            {
              role: "assistant",
              text: `Welcome, ${userData.first_name}! 👋 I'm your Easy Health assistant. I can help you understand your insurance, find doctors, or navigate your health benefits. What would you like to know?`,
              sources: [],
            },
          ]);
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        // App still works — falls back to generic prompt
      }
    };

    fetchUserProfile();
  }, []);

  const handleSend = async (overrideInput?: string) => {
    const text = (overrideInput ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Message = { role: "user", text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    // Build conversation history for the API (exclude the initial greeting)
    const apiHistory: ApiMessage[] = updatedMessages
      .slice(1) // skip the welcome message
      .map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.text,
      }));

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: buildSystemPrompt(userProfile),
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] max-w-2xl mx-auto">
      {messages.length <= 1 && (
        <div className="p-4 animate-slide-up">
          <div className="rounded-xl bg-secondary p-5">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-secondary-foreground">
                Start Here{userProfile ? `, ${userProfile.firstName}` : ""}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Not sure where to begin? Try one of these common questions or type
              your own below.
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 rounded-full bg-card border border-border text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
                  <span className="text-xs font-medium text-muted-foreground">
                    Sources:
                  </span>
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

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-border bg-card/60 backdrop-blur-sm">
        <div className="flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Ask about your health plan..."
            disabled={isLoading}
            className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <Button
            size="icon"
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
