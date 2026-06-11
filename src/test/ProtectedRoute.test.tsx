import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

// Mock AuthContext
let mockUser: { nombre: string; rol: string } | null = null;
let mockIsLoading = false;
let mockIsAuthenticated = false;

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    usuario: mockUser,
    isAuthenticated: mockIsAuthenticated,
    isLoading: mockIsLoading,
    login: vi.fn(),
    logout: vi.fn(),
    consentido: true,
    darConsentimiento: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const TestApp = ({ role }: { role?: string }) => (
  <MemoryRouter initialEntries={["/protected"]}>
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/dashboard" element={<div>Student Dashboard</div>} />
      <Route path="/admin" element={<div>Admin Panel</div>} />
      <Route
        path="/protected"
        element={
          <ProtectedRoute roles={role ? [role as "estudiante" | "administrativo"] : undefined}>
            <div>Protected Content</div>
          </ProtectedRoute>
        }
      />
    </Routes>
  </MemoryRouter>
);

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUser = null;
    mockIsLoading = false;
    mockIsAuthenticated = false;
  });

  it("redirects to /login when not authenticated", async () => {
    render(<TestApp />);
    await waitFor(() => {
      expect(screen.getByText("Login Page")).toBeInTheDocument();
    });
  });

  it("shows protected content when authenticated", async () => {
    mockIsAuthenticated = true;
    mockUser = { nombre: "Test", rol: "estudiante" };
    render(<TestApp />);
    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("redirects estudiante to /dashboard when accessing admin route", async () => {
    mockIsAuthenticated = true;
    mockUser = { nombre: "Student", rol: "estudiante" };
    render(<TestApp role="administrativo" />);
    await waitFor(() => {
      expect(screen.getByText("Student Dashboard")).toBeInTheDocument();
    });
  });

  it("allows admin to access admin route", async () => {
    mockIsAuthenticated = true;
    mockUser = { nombre: "Admin", rol: "administrativo" };
    render(<TestApp role="administrativo" />);
    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });

  it("allows admin to access any protected route without role restriction", async () => {
    mockIsAuthenticated = true;
    mockUser = { nombre: "Admin", rol: "administrativo" };
    render(<TestApp />);
    await waitFor(() => {
      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });
  });
});
