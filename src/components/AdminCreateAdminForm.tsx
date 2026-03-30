import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { hashPassword, normalizeEmail } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
};

type AdminCreateAdminFormProps = {
  /** Called after a new admin is created (e.g. to refresh metrics). */
  onCreated?: () => void;
};

const AdminCreateAdminForm = ({ onCreated }: AdminCreateAdminFormProps) => {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Re-enter the same password in both fields.",
        variant: "destructive",
      });
      return;
    }

    if (form.password.length < 5) {
      toast({
        title: "Password too short",
        description: "Use at least 5 characters.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const normalizedEmail = normalizeEmail(form.email);
      const trimmedFirstName = form.firstName.trim();
      const trimmedLastName = form.lastName.trim();

      const { data: existingUser, error: lookupError } = await supabase
        .from("users")
        .select("user_id")
        .eq("email", normalizedEmail)
        .maybeSingle();

      if (lookupError) {
        throw new Error(lookupError.message);
      }

      if (existingUser) {
        throw new Error("An account with that email already exists.");
      }

      const passwordHash = await hashPassword(form.password);
      const { error } = await supabase.from("users").insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        role: "admin",
        health_profile: null,
        total_balance_due: 0,
        total_copay_amounts: 0,
      });

      if (error) {
        throw new Error(error.message);
      }

      setForm(emptyForm);
      toast({
        title: "Admin account created",
        description: `${trimmedFirstName} ${trimmedLastName} can sign in with ${normalizedEmail}.`,
      });
      onCreated?.();
    } catch (err) {
      toast({
        title: "Could not create admin",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Create admin account</CardTitle>
        </div>
        <CardDescription>
          New accounts from the public sign-up page are always <strong>user</strong> role. Use this form only to add
          another <strong>admin</strong> who can access this dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-first">First name</Label>
              <Input
                id="admin-first"
                value={form.firstName}
                onChange={(e) => setForm((c) => ({ ...c, firstName: e.target.value }))}
                required
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-last">Last name</Label>
              <Input
                id="admin-last"
                value={form.lastName}
                onChange={(e) => setForm((c) => ({ ...c, lastName: e.target.value }))}
                required
                autoComplete="family-name"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
              required
              autoComplete="email"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Password</Label>
              <Input
                id="admin-password"
                type="password"
                value={form.password}
                onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                minLength={5}
                required
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-confirm">Confirm password</Label>
              <Input
                id="admin-confirm"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => setForm((c) => ({ ...c, confirmPassword: e.target.value }))}
                minLength={5}
                required
                autoComplete="new-password"
              />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? "Creating…" : "Create admin account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminCreateAdminForm;
