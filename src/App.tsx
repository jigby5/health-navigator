import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "@/components/AppShell";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import ProtectedRoute from "@/components/ProtectedRoute";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminOKR from "./pages/AdminOKR";
import Dashboard from "./pages/Dashboard";
import MedicalProfile from "./pages/MedicalProfile";
import Transactions from "./pages/Transactions";
import SelectPlan from "./pages/SelectPlan";
import Resources from "./pages/Resources";
import NotFound from "./pages/NotFound";
import EditProfile from "./pages/EditProfile";
import ScrollToTop from "@/components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/admin" element={<AdminProtectedRoute />}>
              <Route index element={<AdminOKR />} />
            </Route>
            <Route element={<AppShell />}>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/select-plan" element={<SelectPlan />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/profile" element={<MedicalProfile />} />
                <Route path="/profile/edit" element={<EditProfile />} />
                <Route path="/transactions" element={<Transactions />} />
                <Route path="/resources" element={<Resources />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
