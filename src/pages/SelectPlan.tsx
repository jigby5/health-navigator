import { Navigate, useNavigate } from "react-router-dom";
import SelectInsurancePlanForm from "@/components/SelectInsurancePlanForm";
import { useAuth } from "@/contexts/AuthContext";

const SelectPlan = () => {
  const { user, enrollmentLoading, hasEnrollment, refreshEnrollment, refreshUser } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  if (enrollmentLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center text-muted-foreground">
        Loading your coverage…
      </div>
    );
  }

  if (hasEnrollment) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-2">Choose your insurance plan</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Select the plan that matches your coverage. You can change this later from Medical Profile.
      </p>
      <SelectInsurancePlanForm
        userId={user.user_id}
        initialCatalogPlanId={null}
        submitLabel="Continue"
        onSuccess={async () => {
          await refreshEnrollment();
          await refreshUser();
          navigate("/dashboard", { replace: true });
        }}
      />
    </div>
  );
};

export default SelectPlan;
