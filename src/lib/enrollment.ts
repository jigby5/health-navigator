import { supabase } from "@/integrations/supabase/client";

/** Creates or replaces the user's enrollment and syncs `users` totals from the catalog plan. */
export async function enrollUserInPlan(userId: number, catalogPlanId: number) {
  const { data: catalog, error: catalogError } = await supabase
    .from("insurance_plan_catalog")
    .select("copay_amount, annual_deductible, out_of_pocket_max")
    .eq("catalog_plan_id", catalogPlanId)
    .single();

  if (catalogError || !catalog) {
    throw new Error(catalogError?.message ?? "Plan not found.");
  }

  const { error: upsertError } = await supabase.from("insurance_plans").upsert(
    {
      user_id: userId,
      catalog_plan_id: catalogPlanId,
      remaining_balance: catalog.annual_deductible,
    },
    { onConflict: "user_id" },
  );

  if (upsertError) {
    throw new Error(upsertError.message);
  }

  const { error: userError } = await supabase
    .from("users")
    .update({
      total_balance_due: catalog.annual_deductible,
      total_copay_amounts: catalog.copay_amount,
    })
    .eq("user_id", userId);

  if (userError) {
    throw new Error(userError.message);
  }
}
