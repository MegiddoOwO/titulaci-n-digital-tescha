import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrivacyConsentModal } from "@/components/PrivacyConsentModal";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Normativa from "./pages/Normativa.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminExpedientes from "./pages/admin/AdminExpedientes.tsx";
import AdminDocumentos from "./pages/admin/AdminDocumentos.tsx";
import AdminDictamenes from "./pages/admin/AdminDictamenes.tsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <PrivacyConsentModal />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute roles={["estudiante"]}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/normativa" element={<Normativa />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute roles={["administrativo"]}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="expedientes" element={<AdminExpedientes />} />
              <Route path="documentos" element={<AdminDocumentos />} />
              <Route path="dictamenes" element={<AdminDictamenes />} />
              <Route path="configuracion" element={<AdminUsuarios />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
