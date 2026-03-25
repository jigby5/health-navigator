import { Shield, CreditCard, Stethoscope, RefreshCw, Info, Calendar, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import SelectInsurancePlanForm from "@/components/SelectInsurancePlanForm";

interface ProfilePlan {
  plan_id: number;
  remaining_balance: number | null;
  catalog_plan_id: number;
  insurance_plan_catalog: {
    plan_name: string;
    copay_amount: number;
    policy_type: string;
    annual_deductible: number;
    out_of_pocket_max: number;
    insurance_providers: {
      name: string;
      network_type: string;
    } | null;
  } | null;
}

interface Doctor {
  doctor_id: number;
  full_name: string;
  specialty: string;
  facility_name: string;
  last_seen: string | null;
}

const MedicalProfile = () => {
  const { user, refreshEnrollment, refreshUser } = useAuth();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [plan, setPlan] = useState<ProfilePlan | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  const loadProfile = async () => {
    if (!user) {
      return;
    }

    const [{ data: planData, error: planError }, { data: doctorData, error: doctorError }] = await Promise.all([
      supabase
        .from("insurance_plans")
        .select(
          `
          plan_id,
          remaining_balance,
          catalog_plan_id,
          insurance_plan_catalog (
            plan_name,
            copay_amount,
            policy_type,
            annual_deductible,
            out_of_pocket_max,
            insurance_providers (name, network_type)
          )
        `,
        )
        .eq("user_id", user.user_id)
        .maybeSingle(),
      supabase
        .from("healthcare_providers")
        .select("doctor_id, full_name, specialty, facility_name")
        .order("full_name", { ascending: true }),
    ]);

    if (planError) {
      toast({
        title: "Couldn't load plan details",
        description: planError.message,
        variant: "destructive",
      });
    } else {
      setPlan((planData as ProfilePlan | null) ?? null);
    }

    if (doctorError) {
      toast({
        title: "Couldn't load doctors",
        description: doctorError.message,
        variant: "destructive",
      });
    } else {
      const baseDoctors: Omit<Doctor, "last_seen">[] = (doctorData ?? []).map((d) => ({
        doctor_id: d.doctor_id,
        full_name: d.full_name,
        specialty: d.specialty,
        facility_name: d.facility_name,
      }));

      const doctorIds = baseDoctors.map((d) => d.doctor_id);
      if (doctorIds.length === 0) {
        setDoctors([]);
        return;
      }

      // Fetch the latest appointment date_time per doctor for this user.
      const { data: appointmentRows, error: apptError } = await supabase
        .from("appointments")
        .select("doctor_id, date_time")
        .eq("user_id", user.user_id)
        .in("doctor_id", doctorIds)
        .order("date_time", { ascending: false });

      if (apptError) {
        toast({
          title: "Couldn't load doctor last seen dates",
          description: apptError.message,
          variant: "destructive",
        });
        setDoctors(baseDoctors.map((d) => ({ ...d, last_seen: null })));
        return;
      }

      const lastSeenByDoctorId: Record<number, string> = {};
      (appointmentRows ?? []).forEach((row) => {
        if (!row.doctor_id) return;
        if (lastSeenByDoctorId[row.doctor_id]) return; // already have the most recent due to sorting
        lastSeenByDoctorId[row.doctor_id] = row.date_time;
      });

      setDoctors(
        baseDoctors.map((d) => ({
          ...d,
          last_seen: lastSeenByDoctorId[d.doctor_id] ?? null,
        })),
      );
    }
  };

  useEffect(() => {
    void loadProfile();
  }, [user]);

  const catalog = plan?.insurance_plan_catalog;
  const provider = catalog?.insurance_providers;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Medical Profile</h1>
        <button
          type="button"
          onClick={() => setChangePlanOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Change plan
        </button>
      </div>

      <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change insurance plan</DialogTitle>
            <DialogDescription>
              Pick a different plan from the catalog. Your copay and deductible totals will update to match.
            </DialogDescription>
          </DialogHeader>
          {user && (
            <SelectInsurancePlanForm
              userId={user.user_id}
              initialCatalogPlanId={plan?.catalog_plan_id ?? null}
              submitLabel="Update plan"
              onSuccess={async () => {
                await refreshEnrollment();
                await refreshUser();
                await loadProfile();
                setChangePlanOpen(false);
                toast({ title: "Plan updated", description: "Your profile now reflects the selected plan." });
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <div className="rounded-xl bg-primary text-primary-foreground p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-semibold opacity-90">Insurance Card</span>
          </div>
          <span className="text-xs opacity-70">EasyHealth ID</span>
        </div>
        <p className="text-xl font-bold">{user ? `${user.first_name} ${user.last_name}` : "Member"}</p>
        <p className="text-sm opacity-80 mt-1">Member ID: EH-{String(user?.user_id ?? 0).padStart(4, "0")}</p>
        <div className="flex gap-6 mt-4 text-xs opacity-80">
          <div>
            <p className="opacity-70">Group #</p>
            <p className="font-medium">GRP-{String(user?.user_id ?? 0).padStart(5, "0")}</p>
          </div>
          <div>
            <p className="opacity-70">Effective</p>
            <p className="font-medium">01/01/2026</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-4">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-primary" />
          Plan Details
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Carrier</p>
            <p className="text-sm font-medium text-foreground">{provider?.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan name</p>
            <p className="text-sm font-medium text-foreground">{catalog?.plan_name ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan Type</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground">{catalog?.policy_type ?? "—"}</span>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    An individual plan covers only you. A family plan can cover dependents like a spouse or children.
                  </p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Deductible (remaining)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    The amount you pay for covered services before your insurance starts to pay.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-foreground">${user?.total_balance_due?.toFixed(2) ?? "0.00"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Co-pay
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    A fixed amount you pay for a covered service after you have paid your deductible.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-foreground">${catalog?.copay_amount?.toFixed(2) ?? "—"} specialist</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Network
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Providers contracted with your plan. In-network care usually costs you less.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-foreground">{provider?.network_type ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Out-of-pocket max (plan year)</p>
            <p className="text-sm font-medium text-foreground">${catalog?.out_of_pocket_max?.toFixed(2) ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining balance (plan)</p>
            <p className="text-sm font-medium text-foreground">${plan?.remaining_balance?.toFixed(2) ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-primary" />
          Doctors in Unit
        </h2>
        {doctors.map((doc) => (
          <div key={doc.doctor_id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
            <div>
              <p className="text-sm font-medium text-foreground">{doc.full_name}</p>
              <p className="text-xs text-muted-foreground">{doc.specialty}</p>
              <p className="text-xs text-muted-foreground">
                Last seen:{" "}
                {doc.last_seen ? format(new Date(doc.last_seen), "M/d/yy") : "—"}
              </p>
            </div>
            <a
              href="tel:(555)123-4567"
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Phone className="w-3 h-3" />
              Call office
            </a>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <Link
          to="/transactions"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
        >
          <CreditCard className="w-4 h-4" />
          View Past Transactions
        </Link>
        <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity">
          <Calendar className="w-4 h-4" />
          Schedule an Appointment
        </button>
      </div>
    </div>
  );
};

export default MedicalProfile;
