import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; // <-- base44 yerine Supabase eklendi
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { aggregateProducts, groupDebtByTable, isToday } from "@/lib/cashier";
import { Loader2, Wallet, AlertTriangle, BarChart3 } from "lucide-react";

export default function EndOfDayDialog({ open, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    
    (async () => {
      try {
        // 1. Supabase'den tüm siparişleri çek (Sadece bugünküleri çekmek performans için daha iyidir ama şimdilik hepsini çekip JS ile filtreliyoruz)
        const { data: list, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_date", { ascending: false });

        if (error) throw error;

        // 2. Sadece "Bugün" ve "Ödemesi Alınmış/Hesaba Yazılmış" siparişleri filtrele
        const todayOrders = (list || []).filter((o) => o.paymentStatus && isToday(o.paidAt));
        
        // 3. Ödenenler ve Borca yazılanları ayır
        const paid = todayOrders.filter((o) => o.paymentStatus === "paid");
        const debt = todayOrders.filter((o) => o.paymentStatus === "debt");
        
        // 4. Verileri state'e yaz
        setData({
          dailyTotal: paid.reduce((s, o) => s + (o.totalAmount || 0), 0),
          debtTotal: debt.reduce((s, o) => s + (o.totalAmount || 0), 0),
          debtList: groupDebtByTable(debt),
          topProducts: aggregateProducts(todayOrders),
        });
      } catch (err) {
        console.error("Gün sonu raporu hatası:", err);
        setData({ dailyTotal: 0, debtTotal: 0, debtList: [], topProducts: [] });
      }
    })();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle>Gün Sonu Raporu</DialogTitle>
        </DialogHeader>

        {!data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Nakit/Kart (Kasa Toplamı) */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-semibold">Günlük Genel Toplam (Kasa)</span>
              </div>
              <p className="mt-1 text-3xl font-bold text-emerald-500">
                {data.dailyTotal.toLocaleString("tr-TR")} TL
              </p>
            </div>

            {/* Veresiye / Borç Toplamı */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-semibold">Müşteri Borcu Toplamı (Veresiye)</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-500">
                {data.debtTotal.toLocaleString("tr-TR")} TL
              </p>
              
              {/* Borçlular Listesi */}
              {data.debtList.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {data.debtList.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm border border-border"
                    >
                      <span className="font-medium text-foreground">
                        {d.customerName} <span className="text-muted-foreground">(Masa {d.tableNumber})</span>
                      </span>
                      <span className="font-bold text-amber-500">{d.total.toLocaleString("tr-TR")} TL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* En Çok Satan Ürünler */}
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-semibold">En Çok Tüketilen Ürünler</span>
              </div>
              <div className="mt-3 space-y-1">
                {data.topProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Bugün henüz ürün satılmadı.</p>
                ) : (
                  data.topProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50"
                    >
                      <span className="flex items-center gap-2 font-medium">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="font-bold text-muted-foreground">{p.qty} Adet</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}