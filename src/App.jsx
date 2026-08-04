import { Toaster } from "@/components/ui/toaster";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClientInstance } from "@/lib/queryClient"; // Projenizdeki dosya adına göre '@/lib/query-client' da yapabilirsiniz
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import PageNotFound from "@/lib/PageNotFound";
import { AuthProvider } from "@/lib/AuthContext";
import ScrollToTop from "@/components/ScrollToTop";
import KitchenScreen from "@/pages/KitchenScreen";
import OrderScreen from "@/pages/OrderScreen";
import CashierScreen from "@/pages/CashierScreen";
import ProfileScreen from "@/pages/ProfileScreen";
import Login from "@/pages/Login";
import { getStaff } from "@/lib/staffSession"; // Dosya adınız 'staff.js' ise '@/lib/staff' yapın

const AuthenticatedApp = () => {
  const staff = getStaff();

  // Oturum açılmamışsa otomatik giriş ekranına yönlendir
  if (!staff) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Oturum açılmışsa rollere/sayfalara erişime izin ver
  return (
    <Routes>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/" element={<KitchenScreen />} />
      <Route path="/order" element={<OrderScreen />} />
      <Route path="/cashier" element={<CashierScreen />} />
      <Route path="/profile" element={<ProfileScreen />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  );
}