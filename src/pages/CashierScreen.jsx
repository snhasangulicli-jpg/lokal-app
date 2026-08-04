import { useEffect, useState, useCallback } from "react";
import AppLayout from "@/components/AppLayout";
import TableCard from "@/components/cashier/TableCard";
import CloseAccountDialog from "@/components/cashier/CloseAccountDialog";
import EndOfDayDialog from "@/components/cashier/EndOfDayDialog";
import { aggregateTables } from "@/lib/cashier";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Search, CalendarClock } from "lucide-react";

export default function CashierScreen() {
  const { toast } = useToast();
  const [orders, setOrders] = useState(null);
  const [search, setSearch] = useState("");
  const [closeTarget, setCloseTarget] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [endOfDay, setEndOfDay] = useState(false);

  // Siparişleri API veya yerel depodan yükleyen yardımcı fonksiyon
  const loadOrders = useCallback(async () => {
    try {
      // Kendi backend endpoint'inizi buraya bağlayabilirsiniz (Örn: fetch('/api/orders'))
      // Geçici/Lokal yapı için localStorage fallback kontrolü:
      const localData = localStorage.getItem("app_orders");
      if (localData) {
        setOrders(JSON.parse(localData));
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Siparişler yüklenirken hata oluştu:", err);
      setOrders([]);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    // Periyodik olarak (15 saniyede bir) verileri güncelle
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const activeOrders = (orders || []).filter((o) => !o.paymentStatus);
  const tables = aggregateTables(activeOrders);
  const filtered = tables.filter((t) =>
    t.tableNumber.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleClose = async (mode, customerName) => {
    setProcessing(true);
    try {
      const paidAt = new Date().toISOString();
      const updatedIds = closeTarget.orderIds;

      // Kendi API veya yerel durum güncellemeniz:
      const updatedOrders = (orders || []).map((o) => {
        if (updatedIds.includes(o.id)) {
          return {
            ...o,
            paymentStatus: mode,
            paidAt,
            ...(customerName ? { customerName } : {}),
          };
        }
        return o;
      });

      setOrders(updatedOrders);
      localStorage.setItem("app_orders", JSON.stringify(updatedOrders));

      toast({ title: `Masa ${closeTarget.tableNumber} kapatıldı ✓` });
      setCloseTarget(null);
    } catch {
      toast({
        variant: "destructive",
        title: "Kapatılamadı",
        description: "Tekrar deneyin.",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="border-b border-border bg-card/60 px-4 py-3 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Kasiyer Ekranı</h1>
              <p className="text-xs text-muted-foreground">Masa hesapları ve ödeme takibi</p>
            </div>
            <button
              onClick={() => setEndOfDay(true)}
              className="select-none inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <CalendarClock className="h-4 w-4" /> Gün Sonu
            </button>
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Masa numarası ara..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
            {orders === null ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-lg font-semibold">Aktif masa yok</p>
                <p className="text-sm text-muted-foreground">Tüm hesaplar kapatıldı.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((t) => (
                  <TableCard key={t.tableNumber} table={t} onClose={setCloseTarget} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <CloseAccountDialog
        table={closeTarget}
        processing={processing}
        onConfirm={handleClose}
        onClose={() => !processing && setCloseTarget(null)}
      />
      <EndOfDayDialog open={endOfDay} onClose={() => setEndOfDay(false)} />
    </AppLayout>
  );
}