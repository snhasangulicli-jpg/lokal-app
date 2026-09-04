import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/lib/AuthContext";

// Sayfalar
import Login from "@/pages/Login";
import KitchenScreen from "@/pages/KitchenScreen";
import OrderScreen from "@/pages/OrderScreen";
import CashierScreen from "@/pages/CashierScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import PatronScreen from "@/pages/PatronScreen"; // <-- SADECE PATRON VAR

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1 },
  },
});

function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <div className="flex h-[100dvh] flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="mt-2 text-lg font-medium text-muted-foreground">Aradığınız sayfa bulunamadı.</p>
      <a href="/" className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90">
        Ana Sayfaya Dön
      </a>
    </div>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<KitchenScreen />} />
        <Route path="/order" element={<OrderScreen />} />
        <Route path="/cashier" element={<CashierScreen />} />
        <Route path="/patron" element={<PatronScreen />} /> {/* <-- YENİ PATRON YOLU */}
        <Route path="/profile" element={<ProfileScreen />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ScrollToTop />
          <AppRoutes />
        </BrowserRouter>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}