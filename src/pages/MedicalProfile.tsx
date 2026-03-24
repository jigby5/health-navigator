import { Shield, CreditCard, Stethoscope, Edit, Info, Calendar, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface ProfilePlan {
  policy_type: string;
  copay_amount: number | null;
  remaining_balance: number | null;
  insurance_providers: {
    name: string;
    network_type: string;
  } | null;
}

interface Doctor {
  doctor_id: number;
  full_name: string;
  specialty: string;
  facility_name: string;
}

const MedicalProfile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [plan, setPlan] = useState<ProfilePlan | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchProfile = async () => {
      const [{ data: planData, error: planError }, { data: doctorData, error: doctorError }] = await Promise.all([
        supabase
          .from("insurance_plans")
          .select("policy_type, copay_amount, remaining_balance, insurance_providers(name, network_type)")
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
        setDoctors(doctorData ?? []);
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Medical Profile</h1>
        <button
          onClick={() => setEditing(!editing)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Edit className="w-3.5 h-3.5" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

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
            <p className="text-xs text-muted-foreground">Plan Name</p>
            <p className="text-sm font-medium text-foreground">{plan?.insurance_providers?.name ?? "Blue Shield PPO"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Plan Type</p>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground">{plan?.policy_type ?? "Individual"}</span>
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
              Deductible
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
            <p className="text-sm font-medium text-foreground">${user?.total_balance_due?.toFixed(2) ?? "0.00"} due</p>
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
                    A fixed amount you pay for a covered service after you've paid your deductible.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-foreground">${plan?.copay_amount?.toFixed(2) ?? "30.00"} specialist</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Out of Network
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Providers not contracted with your plan. You'll pay more if you use them.
                  </p>
                </TooltipContent>
              </Tooltip>
            </p>
            <p className="text-sm font-medium text-foreground">{plan?.insurance_providers?.network_type ?? "PPO"} network</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Out-of-Pocket Max</p>
            <p className="text-sm font-medium text-foreground">${plan?.remaining_balance?.toFixed(2) ?? "3000.00"}</p>
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

      <button className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-accent-foreground font-medium text-sm hover:opacity-90 transition-opacity">
        <Calendar className="w-4 h-4" />
        Schedule an Appointment
      </button>
    </div>
  );
};

export default MedicalProfile;
