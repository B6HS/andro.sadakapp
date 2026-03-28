import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import NetworkStatusBadge from "@/components/NetworkStatusBadge";
import HomeGate from "./pages/HomeGate";
import Index from "./pages/Index";
import TenantLayout from "./pages/TenantLayout";
import Login from "./pages/Login";
import Admin from "./pages/Admin";
import AdminPortal from "./pages/AdminPortal";
import InstallationGuide from "./pages/InstallationGuide";
import ClientTutorial from "./pages/ClientTutorial";
import Iqraa from "./pages/Iqraa";
import Install from "./pages/Install";
import AutoInstall from "./pages/AutoInstall";
import NotFound from "./pages/NotFound";
import WelcomeOnboarding from "@/components/WelcomeOnboarding";
import { DEFAULT_TENANT_SLUG } from "@/lib/brand";

const queryClient = new QueryClient();

const routerBasename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <NetworkStatusBadge />
        <BrowserRouter basename={routerBasename}>
          <WelcomeOnboarding />
          <Routes>
            <Route path="/" element={<Navigate to={`/${DEFAULT_TENANT_SLUG}`} replace />} />
            <Route path="admin-portal" element={<AdminPortal />} />
            <Route path="login" element={<Login />} />
            <Route path="installation" element={<InstallationGuide />} />
            <Route path="tutorial" element={<ClientTutorial />} />
            <Route path="install" element={<Install />} />
            <Route path="auto-install" element={<AutoInstall />} />

            <Route path=":tenantSlug" element={<TenantLayout />}>
              <Route index element={<HomeGate />} />
              <Route path="borne" element={<Index />} />
              <Route path="login" element={<Login />} />
              <Route path="admin" element={<Admin />} />
              <Route path="installation" element={<InstallationGuide />} />
              <Route path="tutorial" element={<ClientTutorial />} />
              <Route path="install" element={<Install />} />
              <Route path="auto-install" element={<AutoInstall />} />
              <Route path="iqraa" element={<Iqraa />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
