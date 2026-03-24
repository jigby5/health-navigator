import { FormEvent, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
<<<<<<< Updated upstream
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const { user, login, createAccount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<"login" | "create">("login");
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
=======
import { Heart, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

type AuthMode = "login" | "register";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
};

const Auth = () => {
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
>>>>>>> Stashed changes

  const redirectPath = (location.state as { from?: string } | null)?.from ?? "/dashboard";

  if (user) {
    return <Navigate to={redirectPath} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
<<<<<<< Updated upstream
    setSaving(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await createAccount(firstName, email, password);
=======
    setLoading(true);

    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        toast({ title: "Welcome back", description: "You are now logged in." });
      } else {
        await register(form);
        toast({ title: "Account created", description: "Your Easy Health account is ready." });
>>>>>>> Stashed changes
      }

      navigate(redirectPath, { replace: true });
    } catch (error) {
      toast({
        title: mode === "login" ? "Login failed" : "Account creation failed",
<<<<<<< Updated upstream
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
=======
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
>>>>>>> Stashed changes
    }
  };

  return (
<<<<<<< Updated upstream
    <div className="max-w-md mx-auto px-4 py-10 animate-fade-in">
      <div className="glass-card rounded-xl p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Log In" : "Create Account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login"
              ? "Use the demo account for Chad or create a new one."
              : "Create an account to unlock the rest of the app."}
          </p>
        </div>

        {mode === "login" && (
          <div className="rounded-lg bg-secondary px-4 py-3 text-sm text-secondary-foreground">
            Demo login for Chad: `chad@example.com` / `chad123`
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "create" && (
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">First Name</label>
              <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1.5">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Please wait..." : mode === "login" ? "Log In" : "Create Account"}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "create" : "login")}
          className="text-sm text-primary hover:underline"
        >
          {mode === "login" ? "Create an account" : "Already have an account? Log in"}
        </button>
=======
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-8">
      <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-gradient-to-br from-secondary via-background to-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Easy Health</p>
              <h1 className="text-3xl font-bold text-foreground">Log in to manage your care</h1>
            </div>
          </div>

          <div className="space-y-4 text-muted-foreground">
            <p>
              Create an account to save your profile, appointments, balances, and coverage details in the database.
            </p>
            <p>
              The AI assistant stays open to everyone, but the dashboard, profile, and resources pages now require a login.
            </p>
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
                minLength={6}
                required
              />
            </div>

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
>>>>>>> Stashed changes
      </div>
    </div>
  );
};

export default Auth;
