import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { enrollUserInPlan } from "@/lib/enrollment";
import { toast } from "@/hooks/use-toast";

export interface CatalogPlanRow {
  catalog_plan_id: number;
  plan_name: string;
  copay_amount: number;
  policy_type: string;
  annual_deductible: number;
  out_of_pocket_max: number;
  insurance_providers: {
    provider_id: number;
    name: string;
    network_type: string;
  } | null;
}

interface SelectInsurancePlanFormProps {
  userId: number;
  /** After successful save (enrollment + user totals updated). */
  onSuccess: () => void | Promise<void>;
  /** Optional: pre-selected catalog id (e.g. current plan). */
  initialCatalogPlanId?: number | null;
  submitLabel?: string;
}

const SelectInsurancePlanForm = ({
  userId,
  onSuccess,
  initialCatalogPlanId,
  submitLabel = "Save plan",
}: SelectInsurancePlanFormProps) => {
  const [plans, setPlans] = useState<CatalogPlanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("insurance_plan_catalog")
        .select(
          "catalog_plan_id, plan_name, copay_amount, policy_type, annual_deductible, out_of_pocket_max, insurance_providers(provider_id, name, network_type)",
        )
        .order("plan_name", { ascending: true });

      if (error) {
        toast({
          title: "Couldn't load plans",
          description: error.message,
          variant: "destructive",
        });
        setPlans([]);
      } else {
        setPlans((data as CatalogPlanRow[]) ?? []);
      }
      setLoading(false);
    };

    void load();
  }, []);

  useEffect(() => {
    if (initialCatalogPlanId != null) {
      setSelectedId(String(initialCatalogPlanId));
    }
  }, [initialCatalogPlanId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId) {
      toast({
        title: "Choose a plan",
        description: "Select an insurance plan from the list.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      await enrollUserInPlan(userId, Number.parseInt(selectedId, 10));
      await onSuccess();
    } catch (error) {
      toast({
        title: "Couldn't save plan",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading plans…
      </div>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="catalog-plan">Insurance plan</Label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger id="catalog-plan" className="w-full">
            <SelectValue placeholder="Select your plan" />
          </SelectTrigger>
          <SelectContent className="max-h-[min(24rem,70vh)]">
            {plans.map((plan) => (
              <SelectItem key={plan.catalog_plan_id} value={String(plan.catalog_plan_id)}>
                {plan.insurance_providers?.name ?? "Provider"} — {plan.plan_name} · ${plan.copay_amount}{" "}
                copay · {plan.policy_type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" className="w-full" disabled={saving || !selectedId}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving…
          </>
        ) : (
          submitLabel
        )}
      </Button>
    </form>
  );
};

export default SelectInsurancePlanForm;
