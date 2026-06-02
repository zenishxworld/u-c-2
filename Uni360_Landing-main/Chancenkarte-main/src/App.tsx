import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Uni360 from "./pages/Uni360";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./components/PrivacyPolicy";
import TermsOfUse from "./components/TermsOfUse";
import CancellationRefundPolicy from "./components/CancellationRefundPolicy";
import CancellationReschedulingPolicy from "./components/CancellationReschedulingPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
  <Route path="/" element={<Index />} />
  <Route path="/uni360" element={<Uni360 />} />
  <Route path="/privacy" element={<PrivacyPolicy />} />
  <Route
    path="/terms"
    element={<TermsOfUse onGoBack={() => window.history.back()} />}
  />
  <Route path="/cancellation-refund" element={<CancellationRefundPolicy />} />
  <Route path="/cancellation-rescheduling" element={<CancellationReschedulingPolicy />} />
  <Route path="*" element={<NotFound />} />
</Routes>

      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;