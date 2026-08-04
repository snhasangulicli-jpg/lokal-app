import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import OrderCard from "@/components/OrderCard";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function Home() {
  const [orders, setOrders] = useState(null);
  const [completingId, setCompletingId] = useState(null);

  // Bekleyen siparişleri API veya yerel hafızadan çeken fonksiyon
  const loadOrders = useCallback(async () => {
    try {
      const localData = localStorage.getItem("app_orders");
      if (localData) {
        const parsed = JSON.parse(localData);
        // Sadece bekleyen (pending) siparişleri filtrele
        const pendingList = parsed.filter((o) => o.status === "pending");
        setOrders(pendingList);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error("Siparişler yüklenirken hata oluştu:", e);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    // Canlı veri takibi için periyodik kontrol
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const handleComplete = async (order) => {
    setCompletingId(order.id);
    try {
      const localData = localStorage.getItem("app_orders");
      if (localData) {
        const allOrders = JSON.parse(localData);
        const updated = allOrders.map((o) =>
          o.id === order.id ? { ...o, status: "completed" } : o
        );
        localStorage.setItem("app_orders", JSON.stringify(updated));
      }
      await loadOrders();
    } catch (error) {
      console.error("Sipariş tamamlanırken hata oluştu:", error);
    } finally {
      setCompletingId(null);
    }
  };

  const pending = orders?.length || 0;

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Mutfak Ekranı</h1>
            <p className="text-sm text-muted-foreground">Gelen siparişleri canlı takip edin</p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            {orders === null ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
            )}
            <span className="text-sm font-semibold">{pending} bekleyen</span>
          </div>
        </div>

        {orders === null ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-24 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-semibold">Bekleyen sipariş yok</p>
            <p className="text-sm text-muted-foreground">Tüm siparişler tamamlandı.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onComplete={handleComplete}
                completing={completingId === order.id}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}