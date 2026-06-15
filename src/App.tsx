import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PrivacyConsentModal } from "@/components/PrivacyConsentModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Landing from "./pages/Landing.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Normativa from "./pages/Normativa.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminExpedientes from "./pages/admin/AdminExpedientes.tsx";
import AdminDocumentos from "./pages/admin/AdminDocumentos.tsx";
import AdminDictamenes from "./pages/admin/AdminDictamenes.tsx";
import AdminUsuarios from "./pages/admin/AdminUsuarios.tsx";
import AdminCatalogos from "./pages/admin/AdminCatalogos.tsx";
import AdminARCO from "./pages/admin/AdminARCO.tsx";
import AsesorDashboard from "./pages/asesor/AsesorDashboard.tsx";
import NotFound from "./pages/NotFound.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <ErrorBoundary>
          <PrivacyConsentModal />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
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
              path="/asesor"
              element={
                <ProtectedRoute roles={["asesor"]}>
                  <AsesorDashboard />
                </ProtectedRoute>
              }
            />
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
              <Route path="usuarios" element={<AdminUsuarios />} />
              <Route path="catalogos" element={<AdminCatalogos />} />
              <Route path="arco" element={<AdminARCO />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
