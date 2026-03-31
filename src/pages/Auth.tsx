import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Heart, LoaderCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { CatalogPlanRow } from "@/components/SelectInsurancePlanForm";
import { enrollUserInPlan } from "@/lib/enrollment";

type AuthMode = "login" | "register";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  coverageValue: "",
};

const Auth = () => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [plansLoading, setPlansLoading] = useState(false);
  const [plans, setPlans] = useState<CatalogPlanRow[]>([]);
  const [form, setForm] = useState(emptyForm);

  const redirectPath = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  useEffect(() => {
    if (mode !== "register") {
      return;
    }

    const loadPlans = async () => {
      setPlansLoading(true);
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

      setPlansLoading(false);
    };

    void loadPlans();
  }, [mode]);

  if (user) {
    const destination = user.role === "admin" ? "/admin" : redirectPath;
    return <Navigate to={destination} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const loggedIn = await login({ email: form.email, password: form.password });
        toast({ title: "Welcome back", description: "You are now logged in." });
        if (loggedIn.role === "admin") {
          navigate("/admin", { replace: true });
          return;
        }
        const { data: plan } = await supabase
          .from("insurance_plans")
          .select("plan_id")
          .eq("user_id", loggedIn.user_id)
          .maybeSingle();
        navigate(plan ? redirectPath : "/select-plan", { replace: true });
      } else {
        if (!form.coverageValue) {
          throw new Error("Choose an insurance plan from the database or select uninsured.");
        }

        const createdUser = await register({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          password: form.password,
        });

        if (form.coverageValue === "uninsured") {
          toast({
            title: "Account created",
            description: "Your account is ready. Uninsured users still use the existing coverage flow, so you can finish on the next screen.",
          });
          navigate("/select-plan", { replace: true });
          return;
        }

        await enrollUserInPlan(createdUser.user_id, Number.parseInt(form.coverageValue, 10));
        toast({ title: "Account created", description: "Your Easy Health account is ready." });
        navigate(redirectPath, { replace: true });
      }
    } catch (error) {
      toast({
        title: mode === "login" ? "Login failed" : "Account creation failed",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-gradient-to-br from-secondary via-background to-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Easy Health</p>
              <h1 className="text-3xl font-bold text-foreground">Healthcare doesn't have to be <span className="text-primary">confusing.</span></h1>
            </div>
          </div>

          <div className="space-y-5 text-muted-foreground">
            <p className="text-sm">A free account unlocks tools designed to save you time, money, and stress.</p>
            <ul className="space-y-3">
              {[
                "Personalized dashboard tracking your appointments & balance",
                "AI assistant tailored to your specific insurance plan",
                "Health tips curated for your age and medical history",
                "Secure storage of your medical profile in one place",
              ].map((benefit) => (
                <li key={benefit} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {benefit}
                </li>
              ))}
            </ul>
            <div className="rounded-2xl bg-card/80 p-4 text-sm text-foreground">
              Demo account: <span className="font-medium">chad@example.com</span>
              <br />
              Password: <span className="font-medium">chad123</span>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-6 flex rounded-xl bg-muted p-1">
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === "login" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                mode === "register" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              Create account
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "register" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))}
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                minLength={5}
                required
              />
            </div>

            {mode === "register" && (
              <div className="space-y-2">
                <Label htmlFor="coverage">Insurance plan</Label>
                <Select
                  value={form.coverageValue}
                  onValueChange={(value) => setForm((current) => ({ ...current, coverageValue: value }))}
                >
                  <SelectTrigger id="coverage">
                    <SelectValue placeholder={plansLoading ? "Loading plans..." : "Choose a plan or uninsured"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[min(24rem,70vh)]">
                    <SelectItem value="uninsured">Uninsured</SelectItem>
                    {plans.map((plan) => (
                      <SelectItem key={plan.catalog_plan_id} value={String(plan.catalog_plan_id)}>
                        {plan.insurance_providers?.name ?? "Provider"} - {plan.plan_name} · ${plan.copay_amount} copay · {plan.policy_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Working...
                </>
              ) : mode === "login" ? (
                "Log in"
              ) : (
                "Create account"
              )}
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Auth;
