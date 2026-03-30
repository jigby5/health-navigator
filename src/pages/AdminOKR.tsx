import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AdminCreateAdminForm from "@/components/AdminCreateAdminForm";
import AdminDeleteAdminSection from "@/components/AdminDeleteAdminSection";
import { CalendarDays, Users } from "lucide-react";

const AdminOKR = () => {
  const [totalUserAccounts, setTotalUserAccounts] = useState<number | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async (options?: { showSpinner?: boolean }) => {
    const showSpinner = options?.showSpinner ?? true;
    if (showSpinner) {
      setLoading(true);
    }
    setError(null);

    const [usersRes, apptsRes] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("appointments").select("*", { count: "exact", head: true }),
    ]);

    const errMsg = usersRes.error?.message ?? apptsRes.error?.message ?? null;
    if (errMsg) {
      setError(errMsg);
    }

    setTotalUserAccounts(usersRes.count ?? 0);
    setTotalAppointments(apptsRes.count ?? 0);
    if (showSpinner) {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMetrics({ showSpinner: true });
  }, [loadMetrics]);

  if (loading) {
    return (
      <p className="text-center text-muted-foreground" aria-live="polite">
        Loading metrics...
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">OKR dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Live counts from the database.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total accounts</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalUserAccounts ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Users with role &quot;user&quot;</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total appointments</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">{totalAppointments ?? "—"}</p>
            <p className="text-xs text-muted-foreground">All rows in appointments</p>
          </CardContent>
        </Card>
      </div>

      <AdminCreateAdminForm onCreated={() => void loadMetrics({ showSpinner: false })} />

      <AdminDeleteAdminSection onDeleted={() => void loadMetrics({ showSpinner: false })} />
    </div>
  );
};

export default AdminOKR;
