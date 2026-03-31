/**
 * Past transactions use the signed-in user. Copay is taken from the enrolled plan catalog;
 * per-visit amounts are not stored on appointments yet.
 */

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Receipt, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AppointmentTransaction {
  appt_id: number;
  date_time: string;
  healthcare_providers: {
    full_name: string;
    facility_name: string;
  } | null;
}

const Transactions = () => {
  const { user } = useAuth();
  const userId = user?.user_id;

  const [transactions, setTransactions] = useState<AppointmentTransaction[]>([]);
  /** Null when user has no plan row (should be rare on this route). */
  const [copayAmount, setCopayAmount] = useState<number | null>(null);
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId == null) {
      setTransactions([]);
      setCopayAmount(null);
      setRemainingBalance(null);
      setLoading(false);
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);

      const [appointmentsResult, planResult] = await Promise.all([
        supabase
          .from("appointments")
          .select("appt_id, date_time, healthcare_providers(full_name, facility_name)")
          .eq("user_id", userId)
          .eq("status", "completed")
          .order("date_time", { ascending: false }),
        supabase
          .from("insurance_plans")
          .select("remaining_balance, insurance_plan_catalog(copay_amount)")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (appointmentsResult.error) {
        toast({
          title: "Could not load transactions",
          description: appointmentsResult.error.message,
          variant: "destructive",
        });
        setTransactions([]);
      } else {
        setTransactions((appointmentsResult.data as unknown as AppointmentTransaction[]) || []);
      }

      if (planResult.error) {
        toast({
          title: "Could not load plan details",
          description: planResult.error.message,
          variant: "destructive",
        });
        setCopayAmount(null);
        setRemainingBalance(null);
      } else if (planResult.data) {
        const catalog = planResult.data.insurance_plan_catalog as { copay_amount?: number } | null;
        setCopayAmount(catalog?.copay_amount ?? 0);
        setRemainingBalance(planResult.data.remaining_balance ?? null);
      } else {
        setCopayAmount(null);
        setRemainingBalance(null);
      }

      setLoading(false);
    };

    void fetchTransactions();
  }, [userId]);

  const totalPaid = useMemo(() => {
    if (copayAmount == null) {
      return null;
    }
    return transactions.length * copayAmount;
  }, [transactions.length, copayAmount]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Past Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review your completed visit charges.
          </p>
        </div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Total paid</p>
          <p className="text-xl font-bold text-foreground">
            {totalPaid == null ? "—" : `$${totalPaid.toFixed(2)}`}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Remaining balance</p>
          <p className="text-xl font-bold text-foreground">
            {remainingBalance == null ? "—" : `$${remainingBalance.toFixed(2)}`}
          </p>
        </div>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground">Loading transactions...</p>
        )}

        {!loading && transactions.length === 0 && (
          <p className="text-sm text-muted-foreground">No past transactions found.</p>
        )}

        {!loading &&
          transactions.map((transaction) => (
            <div
              key={transaction.appt_id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
            >
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 text-secondary-foreground" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Visit copay</p>
                <p className="text-xs text-muted-foreground truncate">
                  {transaction.healthcare_providers?.full_name ?? "Unknown provider"} at{" "}
                  {transaction.healthcare_providers?.facility_name ?? "Unknown facility"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transaction.date_time), "M/d/yy")}
                </p>
              </div>

              <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                {copayAmount == null ? (
                  "—"
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    {copayAmount.toFixed(2)}
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Transactions;
