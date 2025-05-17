import "./polyfills"; // Import the polyfills first
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ContractProvider } from "./context/ContractContext";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ContractProvider>
        <TooltipProvider>
          <Toaster />
          <App />
        </TooltipProvider>
      </ContractProvider>
    </AuthProvider>
  </QueryClientProvider>
);
