import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { Login } from '@/components/auth/Login';
import { SignUp } from '@/components/auth/SignUp';
import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { ResetPassword } from '@/components/auth/ResetPassword';
// import { Dashboard } from '@/components/dashboard/Dashboard';
import { useAuth } from '@/context/AuthContext';
// import { Route, Switch } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Contracts from "@/pages/Contracts";
import Templates from "@/pages/Templates";
import LexiAssistant from "@/pages/LexiAssistant";
import ClientPortal from "@/pages/ClientPortal";
import ClientContractDetails from "@/pages/ClientContractDetails";
import LawyerMarketplace from "@/pages/LawyerMarketplace"; // Lawyer marketplace
import LawyerProfile from "@/pages/LawyerProfile"; // Lawyer profile page
import Consultation from "@/pages/Consultation"; // Consultation page
import ConsultationPaymentConfirmation from "@/pages/ConsultationPaymentConfirmation"; // Payment confirmation
import Billing from "@/pages/Billing";
import Subscriptions from "@/pages/Subscriptions"; // Subscription plans
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import ContractEditor from "@/components/contracts/ContractEditor";

// Payment related pages
import PaymentSimulator from "@/pages/PaymentSimulator";
import PaymentResult from "@/pages/PaymentResult";
import SubscriptionResult from "@/pages/SubscriptionResult";

// Import the LexiAI context provider
import { LexiAIProvider } from "@/context/LexiAIContext";

import Layout from "@/components/layout/Layout";
import { Switch } from 'wouter';

// Protected route wrapper
function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

// Layout wrapper
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <LexiAIProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<LayoutWrapper />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/contracts/edit/:id" element={<ContractEditor />} />
                <Route path="/contracts/:id" element={<ContractEditor />} />
                <Route path="/templates" element={<Templates />} />
                <Route path="/lexi-ai" element={<LexiAssistant />} />
                <Route path="/clients" element={<ClientPortal />} />
                <Route path="/client/contract/:id" element={<ClientContractDetails />} />
                <Route path="/lawyers" element={<LawyerMarketplace />} />
                <Route path="/lawyer/:id" element={<LawyerProfile />} />
                <Route path="/consultation/:id" element={<Consultation />} />
                <Route path="/consultations/payment-confirmation" element={<ConsultationPaymentConfirmation />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/subscriptions" element={<Subscriptions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/payment-simulator" element={<PaymentSimulator />} />
                <Route path="/payment-result" element={<PaymentResult />} />
                <Route path="/subscription-result" element={<SubscriptionResult />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </LexiAIProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
