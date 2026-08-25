import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import AppLayout from "@/components/AppLayout";
import OrderKanbanCard from "@/components/OrderKanbanCard";
import { buildSoldOutNames, REQUIRED_STAGES } from "@/lib/menu";
import { getMenuItems } from "@/lib/menuData";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Printer } from "lucide-react";
import { printReceipt } from "@/lib/printer";

export default function KitchenScreen() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const canEdit = user?.role === 'mutfak' || user?.role === 'kasa';

  const [orders, setOrders] = useState(null);
  const [menu, setMenu] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const soldOutNames = useMemo(() => buildSoldOutNames(menu), [menu]);

  const loadOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "pending")
        .order("created_date", { ascending: false });

      if (error) throw error;
      
      const fetchedOrders = data || [];

      // OTOMATİK YAZDIRMA BEYNİ (Kalıcı Hafızalı)
      const printedOrders = JSON.parse(localStorage.getItem("printed_orders") || "[]");
      let hasNewPrint = false;

      if (printedOrders.length === 0 && fetchedOrders.length > 0) {
        const allIds = fetchedOrders.map(o => o.id);
        localStorage.setItem("printed_orders", JSON.stringify(allIds));
      } else {
        fetchedOrders.forEach(o => {
          if (!printedOrders.includes(o.id)) {
            printedOrders.push(o.id);
            printReceipt(o, "KITCHEN");
            toast({ title: `Masa ${o.tableNumber} YENİ SİPARİŞ! 🖨️` });
            hasNewPrint = true;
          }
        });

        if (hasNewPrint) {
          if (printedOrders.length > 1000) printedOrders.splice(0, printedOrders.length - 1000);
          localStorage.setItem("printed_orders", JSON.stringify(printedOrders));
        }
      }

      setOrders(fetchedOrders);
    } catch (e) {
      setOrders([]);
    }
  }, [toast]);

  const loadMenu = useCallback(async () => {
    try {
      const fetchedMenu = await getMenuItems(); 
      setMenu(fetchedMenu || []);
    } catch (e) {
      setMenu([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    loadMenu();

    const interval = setInterval(() => {
      loadOrders();
    }, 3000);

    return () => clearInterval(interval);
  }, [loadOrders, loadMenu]);

  const handleToggleStage = async (order, stage) => {
    if (!canEdit) return toast({ variant: "destructive", title: "Yetkisiz İşlem", description: "Sadece mutfak işlem yapabilir." });

    setBusyId(order.id);
    const ts = order.stageTimestamps || {};
    const isSet = !!ts[stage];
    const nextTs = { ...ts };
    if (isSet) delete nextTs[stage];
    else nextTs[stage] = new Date().toISOString();

    const updates = { stageTimestamps: nextTs };

    if (!isSet && REQUIRED_STAGES.every((s) => !!nextTs[s])) {
      updates.status = "completed";
      updates.completedAt = new Date().toISOString();
      updates.currentStage = 8;
      nextTs[8] = nextTs[8] || new Date().toISOString();
    }

    try {
      const { error } = await supabase.from("orders").update(updates).eq("id", order.id);
      if (error) throw error;
      await loadOrders();
      if (updates.status === "completed") toast({ title: `Masa ${order.tableNumber} tamamlandı ✓` });
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Güncellenemedi." });
    } finally {
      setBusyId(null);
    }
  };

  const handleComplete = async (order) => {
    if (!canEdit) return toast({ variant: "destructive", title: "Yetkisiz İşlem", description: "Sadece mutfak işlem yapabilir." });
    
    setBusyId(order.id);
    const updates = {
      status: "completed",
      completedAt: new Date().toISOString(),
      currentStage: 8,
      stageTimestamps: { ...(order.stageTimestamps || {}), 8: new Date().toISOString() },
    };

    try {
      const { error } = await supabase.from("orders").update(updates).eq("id", order.id);
      if (error) throw error;
      await loadOrders();
      toast({ title: `Masa ${order.tableNumber} servise hazır ✓` });
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Güncellenemedi." });
    } finally {
      setBusyId(null);
    }
  };

  const handleReprint = (order) => {
    printReceipt(order, "KITCHEN");
    toast({ title: `Masa ${order.tableNumber} tekrar yazdırılıyor...` });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="border-b border-border bg-card/60 px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Mutfak Ekranı</h1>
              <p className="text-xs text-muted-foreground">
                Garson siparişi gönderdiği an fiş otomatik kesilir.
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
                  <div key={order.id} className="flex flex-col gap-2 relative group">
                    <OrderKanbanCard
                      order={order}
                      soldOutNames={soldOutNames}
                      onToggleStage={handleToggleStage}
                      onComplete={handleComplete}
                      busy={busyId === order.id}
                    />
                    
                    {order.note && (
                      <div className="rounded-xl bg-amber-500/15 border border-amber-500/40 p-3 shadow-sm flex items-start gap-2">
                        <span className="text-lg leading-none">⚠️</span>
                        <div>
                          <span className="block uppercase tracking-wider text-[10px] text-amber-500 font-bold mb-0.5">
                            Özel İstek / Not
                          </span>
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {order.note}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end px-1">
                      <button 
                        onClick={() => handleReprint(order)}
                        className="text-[11px] font-bold text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                      >
                        <Printer className="w-3.5 h-3.5" /> Fişi Tekrar Çıkar
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}