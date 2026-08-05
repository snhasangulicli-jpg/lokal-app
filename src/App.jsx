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
import NotFound from "@/pages/NotFound"; // Eğer bu dosyanız yoksa hata vermemesi için aşağıda basit bir 404 sayfası da oluşturabilirsiniz.

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Sayfa değiştiğinde otomatik en üste kaydırma
function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);
  return null;
}

// Ana Yönlendirme Mantığı (Eski staff_session yerine useAuth kullanıyor)
function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/" element={<KitchenScreen />} />
        <Route path="/order" element={<OrderScreen />} />
        <Route path="/cashier" element={<CashierScreen />} />
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