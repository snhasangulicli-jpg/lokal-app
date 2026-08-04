import { useEffect, useState, useCallback, useMemo } from "react";
import AppLayout from "@/components/AppLayout";
import OrderKanbanCard from "@/components/OrderKanbanCard";
import { buildSoldOutNames, REQUIRED_STAGES } from "@/lib/menu";
import { getMenuItems } from "@/lib/menuData"; // Menüyü direkt okuması için eklendi
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function KitchenScreen() {
  const { toast } = useToast();
  const [orders, setOrders] = useState(null);
  const [menu, setMenu] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const soldOutNames = useMemo(() => buildSoldOutNames(menu), [menu]);

  const loadOrders = useCallback(async () => {
    try {
      const localOrders = localStorage.getItem("app_orders");
      if (localOrders) {
        const parsed = JSON.parse(localOrders);
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

  const loadMenu = useCallback(async () => {
    try {
      // Artık sadece localStorage değil, menüyü bulamazsa CSV'den çekecek güvenli fonksiyona bağladık
      const fetchedMenu = await getMenuItems(); 
      setMenu(fetchedMenu || []);
    } catch (e) {
      console.error("Menü çekme hatası:", e);
      setMenu([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadMenu();

    const interval = setInterval(() => {
      loadOrders();
      loadMenu(); // Stok vb. dinamik bir güncellemeyi yakalamak için periyodik okunuyor
    }, 5000);

    return () => clearInterval(interval);
  }, [loadOrders, loadMenu]);

  const handleToggleStage = async (order, stage) => {
    setBusyId(order.id);
    const ts = order.stageTimestamps || {};
    const isSet = !!ts[stage];
    const nextTs = { ...ts };
    if (isSet) {
      delete nextTs[stage];
    } else {
      nextTs[stage] = new Date().toISOString();
    }

    const updates = { stageTimestamps: nextTs };

    if (!isSet && REQUIRED_STAGES.every((s) => !!nextTs[s])) {
      updates.status = "completed";
      updates.completedAt = new Date().toISOString();
      updates.currentStage = 8;
      nextTs[8] = nextTs[8] || new Date().toISOString();
    }

    try {
      const localData = localStorage.getItem("app_orders");
      if (localData) {
        const allOrders = JSON.parse(localData);
        const updated = allOrders.map((o) =>
          o.id === order.id ? { ...o, ...updates } : o
        );
        localStorage.setItem("app_orders", JSON.stringify(updated));
      }
      await loadOrders();

      if (updates.status === "completed") {
        toast({ title: `Masa ${order.tableNumber} tamamlandı ✓` });
      }
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Güncellenmedi",
        description: "Lütfen tekrar deneyin.",
      });
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (order) => {
    setBusyId(order.id);
    const updates = {
      status: "completed",
      completedAt: new Date().toISOString(),
      currentStage: 8,
      stageTimestamps: {
        ...(order.stageTimestamps || {}),
        8: new Date().toISOString(),
      },
    };

    try {
      const localData = localStorage.getItem("app_orders");
      if (localData) {
        const allOrders = JSON.parse(localData);
        const updated = allOrders.map((o) =>
          o.id === order.id ? { ...o, ...updates } : o
        );
        localStorage.setItem("app_orders", JSON.stringify(updated));
      }
      await loadOrders();

      toast({ title: `Masa ${order.tableNumber} servise hazır ✓` });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Güncellenmedi",
        description: "Lütfen tekrar deneyin.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="border-b border-border bg-card/60 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mutfak Ekranı</h1>
              <p className="text-xs text-muted-foreground">
                Aktif siparişler — aşamaları istediğiniz sırayla işaretleyin
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5">
              {orders === null ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                </span>
              )}
              <span className="text-sm font-semibold">{orders?.length || 0} aktif</span>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          {orders === null ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-lg font-semibold">Aktif sipariş yok</p>
              <p className="text-sm text-muted-foreground">Tüm siparişler tamamlandı.</p>
            </div>
          ) : (
            <div className="mx-auto max-w-7xl px-4 py-4 md:px-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {orders.map((order) => (
                  <OrderKanbanCard
                    key={order.id}
                    order={order}
                    soldOutNames={soldOutNames}
                    onToggleStage={handleToggleStage}
                    onComplete={handleComplete}
                    busy={busyId === order.id}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}