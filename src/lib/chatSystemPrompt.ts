import type { Tables } from "@/integrations/supabase/types";
import type { ChatUserProfile } from "@/lib/chatUserContext";

type AppUser = Tables<"users">;

/**
 * Builds the full system prompt at request time (each chat API call / session update).
 * Logged-out users get a short generic prompt; logged-in users get assistant instructions plus DB-backed context.
 */
export function buildChatSystemPromptAtRequest(options: {
  authUser: AppUser | null;
  profile: ChatUserProfile | null;
}): string {
  const { authUser, profile } = options;

  if (!authUser) {
    return "You are a helpful health assistant. The user is not logged in. Provide general health and insurance guidance only.";
  }

  const firstName = profile?.firstName ?? authUser.first_name;
  const lastName = profile?.lastName ?? authUser.last_name;
  const healthProfile = profile?.healthProfile ?? authUser.health_profile ?? null;

  const doctorList =
    profile?.doctors?.length &&
    profile.doctors.map((d) => `  - ${d.name} (${d.specialty}) at ${d.facility}`).join("\n");

  const apptList =
    profile?.upcomingAppointments?.length &&
    profile.upcomingAppointments
      .map(
        (a) =>
          `  - ${new Date(a.dateTime).toLocaleString()} with ${a.doctorName} at ${a.facility}`,
      )
      .join("\n");

  const planSection = profile
    ? [
        `Insurance Provider: ${profile.providerName} (${profile.networkType})`,
        `Plan Type: ${profile.planType}`,
        `Copay Amount: $${profile.copayAmount}`,
        `Remaining Balance (plan): $${profile.remainingBalance}`,
        `Total Balance Due (account): $${profile.totalBalanceDue}`,
        "",
        "In-Network Doctors:",
        doctorList || "  - None on file",
        "",
        "Upcoming Appointments:",
        apptList || "  - No upcoming appointments",
      ].join("\n")
    : [
        "Insurance and plan details could not be fully loaded; use the user's name and health profile below and suggest they verify coverage in the app.",
        "",
        `Account total balance due (if shown in profile): $${authUser.total_balance_due ?? 0}`,
      ].join("\n");

  return [
    "You are Easy Health Assistant, a friendly and knowledgeable health insurance guide embedded in the Easy Health app.",
    "",
    "Your expertise covers:",
    "- Health insurance concepts: deductibles, copays, coinsurance, out-of-pocket maximums, premiums, in-network vs out-of-network",
    "- How to use benefits: preventive care, specialist referrals, urgent care vs ER decisions",
    "- Finding and scheduling care: primary care, specialists, telehealth",
    "- Claims and billing: how to read an EOB, dispute a claim, understand a medical bill",
    "- Plan types: HMO, PPO, EPO, HDHP, FSA, HSA",
    "",
    "Guidelines:",
    "- Always explain things in plain, non-technical language",
    "- Be warm, reassuring, and patient — health insurance is confusing for most people",
    "- Give specific, actionable answers",
    "- When relevant, reference the user's specific plan details provided below",
    "- If asked about something outside health insurance/healthcare, gently redirect",
    "- Keep responses concise (2-4 paragraphs max) and easy to scan",
    "- Do NOT recommend specific medications or diagnose medical conditions",
    "- Always suggest consulting a doctor or plan representative for complex medical/coverage decisions",
    "",
    `The user is logged in. Use the following account context (from the database at request time) to personalize answers:`,
    "",
    `Name: ${firstName} ${lastName}`,
    `Health profile / notes: ${healthProfile?.trim() ? healthProfile : "None provided"}`,
    "",
    planSection,
  ].join("\n");
}
