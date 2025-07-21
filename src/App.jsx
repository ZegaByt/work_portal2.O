import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { Suspense, Component } from "react"; // Import Component for ErrorBoundary
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { MantineProvider } from "@mantine/core"; // Import MantineProvider
import "@mantine/core/styles.css"; // Import Mantine styles

// Import your loading spinner
import LoadingSpinner from "./components/LoadingSpinner";

// Lazy load your components
const AllAdmins = React.lazy(() => import("./pages/dashboard/superadmin/AllAdmins"));
const AllEmployees = React.lazy(() => import("./pages/dashboard/superadmin/AllEmployees"));
const EmployeeDetail = React.lazy(() => import("./pages/dashboard/superadmin/EmployeeDetails"));
const AdminDetail = React.lazy(() => import("./pages/dashboard/superadmin/AdminDetails"));
const AllCustomers = React.lazy(() => import("./pages/dashboard/superadmin/AllCustomers"));
const CustomerDetails = React.lazy(() => import("./pages/dashboard/superadmin/CustomerDetails"));
const EmpCustomerDetails = React.lazy(() => import("./pages/dashboard/employee/EmpCustomerDetails"));
const EmpAllCustomers = React.lazy(() => import("./pages/dashboard/employee/EmpAllCustomers"));
const MyCustomers = React.lazy(() => import("./pages/dashboard/employee/MyCustomers"));
const MyLoginHistory = React.lazy(() => import("./pages/dashboard/superadmin/MyLoginHistory"));
const MyEmpLoginHistory = React.lazy(() => import("./pages/dashboard/superadmin/MyEmpLoginHistory"));
const PaymentAdminView = React.lazy(() => import("./pages/dashboard/superadmin/PaymentAdminView"));
const EmployeeCustomerInterests = React.lazy(() => import("./pages/dashboard/employee/EmployeeCustomersInterests"));
// If the file is UnAssignedCustomers.jsx
const NotListed = React.lazy(() => import('./pages/dashboard/employee/NotListed'));

const OfflineCustomers = React.lazy(() => import("./pages/dashboard/superadmin/OfflineCustomers"));
const LiveCustomers = React.lazy(() => import("./pages/dashboard/superadmin/LiveCustomers"));
const EmployeeLeadFollowUps = React.lazy(() => import("./pages/dashboard/superadmin/EmployeeLeadFollowUps"));
const DailyWorkReport = React.lazy(() => import("./pages/dashboard/superadmin/DailyWorkReport"));
const PreferredMatches = React.lazy(() => import("./pages/dashboard/superadmin/PreferredMatches"));
const MyPinnedCustomers = React.lazy(() => import("./pages/dashboard/employee/MyPinnedCustomers"));
const ActionToday = React.lazy(() => import("./pages/dashboard/employee/ActionToday"));
const MyWorkReport = React.lazy(() => import("./pages/dashboard/employee/MyWorkReport"));
const SuccessStories = React.lazy(() => import("./pages/dashboard/superadmin/SuccessStories"));
const Incharges = React.lazy(() => import("./pages/dashboard/superadmin/Incharges"));
const MatchMakingApp = React.lazy(() => import("./pages/dashboard/employee/MatchMakingApp"));
const TeluguCalendar = React.lazy(() => import("./pages/dashboard/employee/TeluguCalendar"));
const CustomersUnassigned = React.lazy(() => import("./pages/dashboard/superadmin/CustomersUnassigned"));
const MyEmployees = React.lazy(() => import("./pages/dashboard/admin/MyEmployees"));
const MyEmpFollowUps = React.lazy(() => import("./pages/dashboard/admin/MyEmpFollowUps"));
const MyEmpDailyWorkReport = React.lazy (()=> import("./pages/dashboard/admin/MyEmpDailyWorkReport"));
const PaymentApprovalAdmin = React.lazy(() => import("./pages/dashboard/admin/PaymentApprovalAdmin"));
const EmployeeLoginHistory = React.lazy(() => import("./pages/dashboard/admin/EmployeeLoginHistory"));
const AllRequests = React.lazy(() => import("./pages/dashboard/superadmin/AllRequests"));
const MyEmpAllRequests = React.lazy(() => import("./pages/dashboard/admin/MyEmpAllRequests"));
const BureauDashboard = React.lazy(() => import("./pages/dashboard/employee/BureauDashboard"));
const SupCustomerDetails= React.lazy(() => import("./pages/dashboard/superadmin/EmpCustomerDetails"));
const EmpLiveCustomers = React.lazy(()=> import("./pages/dashboard/employee/LiveCustomers"))
const EmpOfflineCustomers = React.lazy(()=> import("./pages/dashboard/employee/MyOfflineCustomers"))
const MyEmpActionToday = React.lazy(() => import("./pages/dashboard/admin/MyEmpActionToday"));
const AdminAllCustomers = React.lazy(() => import("./pages/dashboard/admin/EmpAllCustomers"));
const AdminEmpCustomerDetails = React.lazy(()=> import("./pages/dashboard/admin/EmpCustomerDetails"));
const AdminOfflineCustomers=React.lazy(()=> import("./pages/dashboard/admin/OfflineCustomers"));
const AdminLiveCustomers=React.lazy(()=> import("./pages/dashboard/admin/LiveCustomers"));
const AdminCustomersUnassigned= React.lazy(()=> import("./pages/dashboard/admin/CustomersUnassigned"));
// Pages
const Index = React.lazy(() => import("./pages/Index"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Login pages
const EmployeeLogin = React.lazy(() => import("./pages/login/EmployeeLogin"));
const AdminLogin = React.lazy(() => import("./pages/login/AdminLogin"));
const SuperAdminLogin = React.lazy(() => import("./pages/login/SuperAdminLogin"));

// Dashboard components
import DashboardLayout from "./components/dashboard/DashboardLayout";

// Employee routes
const EmployeeDashboard = React.lazy(() => import("./pages/dashboard/employee/Dashboard"));
const EmployeeKeySearch = React.lazy(() => import("./pages/dashboard/employee/KeySearch"));
const EmployeeSpecialSearch = React.lazy(() => import("./pages/dashboard/employee/SpecialSearch"));


// Admin routes
const AdminDashboard = React.lazy(() => import("./pages/dashboard/admin/Dashboard"));
const AdminKeySearch = React.lazy(() => import("./pages/dashboard/admin/KeySearch"));
const AdminSpecialSearch = React.lazy(() => import("./pages/dashboard/admin/SpecialSearch"));


// Super Admin routes
const SuperAdminDashboard = React.lazy(() => import("./pages/dashboard/superadmin/Dashboard"));
const SuperAdminKeySearch = React.lazy(() => import("./pages/dashboard/superadmin/KeySearch"));
const SuperAdminSpecialSearch = React.lazy(() => import("./pages/dashboard/superadmin/SpecialSearch"));


// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong.</h2>
            <p className="text-gray-600">{this.state.error?.message || "An unexpected error occurred."}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    switch (userRole) {
      case "Employee":
        return <Navigate to="/dashboard/employee" replace />;
      case "Admin":
        return <Navigate to="/dashboard/admin" replace />;
      case "SuperAdmin":
        return <Navigate to="/dashboard/superadmin" replace />;
      default:
        return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};

const queryClient = new QueryClient();

const App = () => (
  <MantineProvider> {/* Wrap with MantineProvider */}
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <ErrorBoundary> {/* Wrap with ErrorBoundary */}
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login/employee" element={<EmployeeLogin />} />
                  <Route path="/login/admin" element={<AdminLogin />} />
                  <Route path="/login/superadmin" element={<SuperAdminLogin />} />
                  <Route path="/login" element={<Navigate to="/login/employee" replace />} />


                  {/* Standalone Protected Route for All Customers
                  <Route
                    path="customer/:user_id"
                    element={
                      <ProtectedRoute allowedRoles={["Employee", "Admin", "SuperAdmin"]}>
                        <EmpAllCustomers />
                      </ProtectedRoute>
                    }
                  /> */}

                  {/* Employee */}
                  <Route
                    path="/dashboard/employee"
                    element={
                      <ProtectedRoute allowedRoles={["Employee"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<EmployeeDashboard />} />
                    <Route path="key-search" element={<EmployeeKeySearch />} />
                    <Route path="special-search" element={<EmployeeSpecialSearch />} />
                    
                    <Route path="all-customers" element={<EmpAllCustomers />} />
                    <Route path="customer/:user_id" element={<EmpCustomerDetails />} />
                    <Route path="my-customers" element={<MyCustomers />} />
                    <Route path="customers-interests" element={<EmployeeCustomerInterests />} />
                    <Route path="unassigned-customers" element={<NotListed />} />
                    <Route path="offline-customers" element={<EmpOfflineCustomers />} />
                    <Route path="live-customers" element={<EmpLiveCustomers />} />
                    <Route path="pinned-customers" element={<MyPinnedCustomers />} />
                    <Route path="action-today" element={<ActionToday />} />
                    <Route path="my-work" element={<MyWorkReport />} />
                    <Route path="success-stories" element={<SuccessStories />} />
                    <Route path="match-making" element={<MatchMakingApp />} />
                    <Route path="telugu-calendar" element={<TeluguCalendar />} />
                    <Route path="my-login-history" element={<MyLoginHistory />} />
                    <Route path="dashboard2" element={<BureauDashboard />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Admin */}
                  <Route
                    path="/dashboard/admin"
                    element={
                      <ProtectedRoute allowedRoles={["Admin"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<AdminDashboard />} />
                    <Route path="key-search" element={<AdminKeySearch />} />
                    <Route path="special-search" element={<AdminSpecialSearch />} />
                
                    <Route path="all-customers" element={<AdminAllCustomers />} />
                    <Route path="customer/:user_id" element={<AdminEmpCustomerDetails />} />
                    <Route path="customers-interests" element={<EmployeeCustomerInterests />} />
                    <Route path="offline-customers" element={<AdminOfflineCustomers />} />
                    <Route path="live-customers" element={<AdminLiveCustomers />} />
                    <Route path="success-stories" element={<SuccessStories />} />
                    <Route path="incharges" element={<Incharges />} />
                    <Route path="match-making" element={<MatchMakingApp />} />
                    <Route path="telugu-calendar" element={<TeluguCalendar />} />
                    <Route path="my-login-history" element={<MyLoginHistory />} />
                    <Route path="my-emp-login-history" element={<MyEmpLoginHistory />} />
                     <Route path="daily-work-report" element={<DailyWorkReport />} />
                      <Route path="emp-followups" element={<MyEmpFollowUps />} />
                    <Route path="customer-unas" element={<AdminCustomersUnassigned />} />
                    <Route path="my-employees" element={<MyEmployees />} />
                    <Route path="my-emp-daily-work-report" element={<MyEmpDailyWorkReport />} />
                    <Route path="payment-admin" element={<PaymentApprovalAdmin />} />
                    <Route path="employee-logins" element={<EmployeeLoginHistory />} />
                    <Route path="emp-requests" element={<MyEmpAllRequests />} />
                    <Route path="dashboard2" element={<BureauDashboard />} />
                    <Route path="my-emp-actions" element={<MyEmpActionToday />} />
                  </Route>

                  {/* SuperAdmin */}
                  <Route
                    path="/dashboard/superadmin"
                    element={
                      <ProtectedRoute allowedRoles={["SuperAdmin"]}>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<SuperAdminDashboard />} />
                    <Route path="key-search" element={<SuperAdminKeySearch />} />
                    <Route path="special-search" element={<SuperAdminSpecialSearch />} />
            
                    <Route path="all-admins" element={<AllAdmins />} />
                    <Route path="all-employees" element={<AllEmployees />} />
                    <Route path="employee/:id" element={<EmployeeDetail />} />
                    <Route path="admin/:id" element={<AdminDetail />} />
                    <Route path="all-customers" element={<AllCustomers />} />
                    <Route path="customer/:user_id" element={<SupCustomerDetails />} />
                    <Route path="my-login-history" element={<MyLoginHistory />} />
                    <Route path="my-emp-login-history" element={<MyEmpLoginHistory />} />
                    <Route path="payment-approval" element={<PaymentAdminView />} />
                    <Route path="offline-customers" element={<OfflineCustomers />} />
                    <Route path="live-customers" element={<LiveCustomers />} />
                    <Route path="lead-followups" element={<EmployeeLeadFollowUps />} />
                    <Route path="daily-work-report" element={<DailyWorkReport />} />
                    <Route path="preferred-matches" element={<PreferredMatches />} />
                    <Route path="success-stories" element={<SuccessStories />} />
                    <Route path="incharges" element={<Incharges />} />
                    <Route path="match-making" element={<MatchMakingApp />} />
                    <Route path="telugu-calendar" element={<TeluguCalendar />} />
                    <Route path="customer-unas" element={<CustomersUnassigned />} />
                    <Route path="all-requests" element={<AllRequests/>} />
                    <Route path="dashboard2" element={<BureauDashboard />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </MantineProvider>
);

export default App;