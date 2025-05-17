import { Route, Switch } from "wouter";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
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

function App() {
  return (
    <LexiAIProvider>
      {/* We only exclude the Layout on the login page */}
      <Route path="/login">
        {() => <Login />}
      </Route>
      
      <Route path="*">
        {(params) => {
          // Skip the login route completely
          if (params === 'login') return null;
          
          return (
            <Layout>
              <Switch>
                <Route path="/" component={Dashboard} />
                
                {/* Contract routes */}
                <Route path="/contracts" component={Contracts} />
                <Route path="/contracts/edit/:id">
                  {(params) => <ContractEditor contractId={parseInt(params.id)} />}
                </Route>
                <Route path="/contracts/:id">
                  {(params) => <ContractEditor contractId={parseInt(params.id)} />}
                </Route>
                <Route path="/templates" component={Templates} />
                
                {/* Lexi AI assistant */}
                <Route path="/lexi-ai" component={LexiAssistant} />
                
                {/* Client portal */}
                <Route path="/clients" component={ClientPortal} />
                <Route path="/client/contract/:id" component={ClientContractDetails} />
                
                {/* Lawyer marketplace routes */}
                <Route path="/lawyers" component={LawyerMarketplace} />
                <Route path="/lawyer/:id" component={LawyerProfile} /> 
                <Route path="/consultation/:id" component={Consultation} />
                <Route path="/consultations/payment-confirmation" component={ConsultationPaymentConfirmation} />
                
                {/* Billing and settings */}
                <Route path="/billing" component={Billing} />
                <Route path="/subscriptions" component={Subscriptions} />
                <Route path="/settings" component={Settings} />
                
                {/* Payment related routes */}
                <Route path="/payment-simulator" component={PaymentSimulator} />
                <Route path="/payment-result" component={PaymentResult} />
                <Route path="/subscription-result" component={SubscriptionResult} />
                
                {/* 404 page */}
                <Route component={NotFound} />
              </Switch>
            </Layout>
          );
        }}
      </Route>
    </LexiAIProvider>
  );
}

export default App;
