import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { EmployeeAuthProvider } from "@/contexts/EmployeeAuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmployeeProtectedRoute } from "@/components/auth/EmployeeProtectedRoute";
import Index from "./pages/Index";
import POS from "./pages/POS";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Investments from "./pages/Investments";
import Marketing from "./pages/Marketing";
import Analytics from "./pages/Analytics";
import HR from "./pages/HR";
import Payroll from "./pages/Payroll";
import Branches from "./pages/Branches";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import Bills from "./pages/Bills";
import NotFound from "./pages/NotFound";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import EmployeeInventory from "./pages/EmployeeInventory";
import EmployeePOS from "./pages/EmployeePOS";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <EmployeeAuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Admin/User Protected Routes */}
              <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
              <Route path="/pos" element={<ProtectedRoute><POS /></ProtectedRoute>} />
              <Route path="/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
              <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
              <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
              <Route path="/investments" element={<ProtectedRoute><Investments /></ProtectedRoute>} />
              <Route path="/marketing" element={<ProtectedRoute><Marketing /></ProtectedRoute>} />
              <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
              <Route path="/hr" element={<ProtectedRoute><HR /></ProtectedRoute>} />
              <Route path="/payroll" element={<ProtectedRoute><Payroll /></ProtectedRoute>} />
              <Route path="/branches" element={<ProtectedRoute><Branches /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              
              {/* Employee Protected Routes */}
              <Route path="/employee-dashboard" element={<EmployeeProtectedRoute><EmployeeDashboard /></EmployeeProtectedRoute>} />
              <Route path="/employee/inventory" element={<EmployeeProtectedRoute><EmployeeInventory /></EmployeeProtectedRoute>} />
              <Route path="/employee/pos" element={<EmployeeProtectedRoute><EmployeePOS /></EmployeeProtectedRoute>} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </EmployeeAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
