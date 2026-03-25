// Some notes:
/**
right now it has a user hard coded so we can see how it works, once we add the ability
for users to log in we will need to change that. 
Right now every transaction displays the
same copay amount copayAmount so if the database later has variable prices, this code
would not reflect that correctly.
Right now there is no pagination 
 */

import { useEffect, useMemo, useState } from "react";
import { DollarSign, Receipt, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AppointmentTransaction {
  appt_id: number;
  date_time: string;
  healthcare_providers: {
    full_name: string;
    facility_name: string;
  } | null;
}

// hard coded user until we have users log in and use their info
const CHAD_USER_ID = 1;

const Transactions = () => {
  const [transactions, setTransactions] = useState<AppointmentTransaction[]>([]);
  const [copayAmount, setCopayAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);

      const [appointmentsResult, planResult] = await Promise.all([
        supabase
          .from("appointments")
          .select("appt_id, date_time, healthcare_providers(full_name, facility_name)")
          .eq("user_id", CHAD_USER_ID)
          .eq("status", "completed")
          .order("date_time", { ascending: false }),
        supabase
          .from("insurance_plans")
          .select("remaining_balance, insurance_plan_catalog(copay_amount)")
          .eq("user_id", CHAD_USER_ID)
          .single(),
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
      } else {
        setCopayAmount(planResult.data?.insurance_plan_catalog?.copay_amount ?? 0);
        setRemainingBalance(planResult.data?.remaining_balance ?? 0);
      }

      setLoading(false);
    };

    fetchTransactions();
  }, []);

  const totalPaid = useMemo(
    () => transactions.length * copayAmount,
    [transactions.length, copayAmount],
  );

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
          <p className="text-xl font-bold text-foreground">${totalPaid.toFixed(2)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Transactions</p>
          <p className="text-xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-muted-foreground">Remaining balance</p>
          <p className="text-xl font-bold text-foreground">${remainingBalance.toFixed(2)}</p>
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
                <DollarSign className="w-4 h-4" />
                {copayAmount.toFixed(2)}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Transactions;
