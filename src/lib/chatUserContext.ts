import { supabase } from "@/integrations/supabase/client";

/** Profile data used to personalize the AI chat (fetched per logged-in user). */
export interface ChatUserProfile {
  firstName: string;
  lastName: string;
  healthProfile: string | null;
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

export async function fetchChatUserContext(userId: number): Promise<ChatUserProfile | null> {
  try {
    const { data: userData, error } = await supabase
      .from("users")
      .select(
        `
            first_name,
            last_name,
            health_profile,
            total_balance_due,
            total_copay_amounts,
            insurance_plans (
              remaining_balance,
              insurance_plan_catalog (
                copay_amount,
                policy_type,
                annual_deductible,
                out_of_pocket_max,
                insurance_providers (
                  name,
                  network_type,
                  provider_id
                )
              )
            )
          `,
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !userData) {
      return null;
    }

    const planRow = (userData as { insurance_plans?: unknown }).insurance_plans;
    const plan = Array.isArray(planRow) ? planRow[0] : planRow;
    const catalog =
      plan && typeof plan === "object" && "insurance_plan_catalog" in plan
        ? (plan as { insurance_plan_catalog: { provider_id?: number } | null }).insurance_plan_catalog
        : null;
    const providerId = catalog?.provider_id;

    let doctors: ChatUserProfile["doctors"] = [];
    if (providerId != null) {
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
        .eq("insurance_provider_id", providerId);

      doctors =
        networkData?.map((n: { healthcare_providers: { full_name: string; specialty: string; facility_name: string } }) => ({
          name: n.healthcare_providers.full_name,
          specialty: n.healthcare_providers.specialty,
          facility: n.healthcare_providers.facility_name,
        })) ?? [];
    }

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
      .eq("user_id", userId)
      .eq("status", "scheduled")
      .gte("date_time", new Date().toISOString())
      .order("date_time", { ascending: true })
      .limit(10);

    const upcomingAppointments =
      apptData?.map((a: { date_time: string; healthcare_providers: { full_name: string; facility_name: string } | null }) => ({
        dateTime: a.date_time,
        doctorName: a.healthcare_providers?.full_name ?? "Unknown",
        facility: a.healthcare_providers?.facility_name ?? "Unknown",
      })) ?? [];

    const planArr = (userData as { insurance_plans?: unknown }).insurance_plans;
    const planSingle = Array.isArray(planArr) ? planArr[0] : planArr;
    const catalogRow =
      planSingle && typeof planSingle === "object" && "insurance_plan_catalog" in planSingle
        ? (planSingle as { insurance_plan_catalog: Record<string, unknown> | null }).insurance_plan_catalog
        : null;
    const provider =
      catalogRow && typeof catalogRow === "object" && "insurance_providers" in catalogRow
        ? (catalogRow as { insurance_providers: { name?: string; network_type?: string } | null }).insurance_providers
        : null;

    return {
      firstName: userData.first_name,
      lastName: userData.last_name,
      healthProfile: userData.health_profile,
      planType: (catalogRow?.policy_type as string) ?? "Unknown",
      providerName: provider?.name ?? "Unknown",
      networkType: provider?.network_type ?? "Unknown",
      copayAmount: (catalogRow?.copay_amount as number) ?? 0,
      remainingBalance:
        (planSingle && typeof planSingle === "object" && "remaining_balance" in planSingle
          ? (planSingle as { remaining_balance: number }).remaining_balance
          : 0) ?? 0,
      totalBalanceDue: userData.total_balance_due ?? 0,
      doctors,
      upcomingAppointments,
    };
  } catch {
    return null;
  }
}
