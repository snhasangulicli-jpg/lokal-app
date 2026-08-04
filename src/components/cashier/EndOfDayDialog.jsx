import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { aggregateProducts, groupDebtByTable, isToday } from "@/lib/cashier";
import { Loader2, Wallet, AlertTriangle, BarChart3 } from "lucide-react";

export default function EndOfDayDialog({ open, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const list = await base44.entities.Order.list("-created_date", 2000);
        const todayOrders = list.filter((o) => o.paymentStatus && isToday(o.paidAt));
        const paid = todayOrders.filter((o) => o.paymentStatus === "paid");
        const debt = todayOrders.filter((o) => o.paymentStatus === "debt");
        setData({
          dailyTotal: paid.reduce((s, o) => s + (o.totalAmount || 0), 0),
          debtTotal: debt.reduce((s, o) => s + (o.totalAmount || 0), 0),
          debtList: groupDebtByTable(debt),
          topProducts: aggregateProducts(todayOrders),
        });
      } catch {
        setData({ dailyTotal: 0, debtTotal: 0, debtList: [], topProducts: [] });
      }
    })();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Gün Sonu Raporu</DialogTitle>
        </DialogHeader>

        {!data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-medium">Günlük Genel Toplam (Kasa)</span>
              </div>
              <p className="mt-1 text-3xl font-bold text-emerald-400">
                {data.dailyTotal.toLocaleString("tr-TR")} TL
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-medium">Müşteri Borcu Toplamı</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-400">
                {data.debtTotal.toLocaleString("tr-TR")} TL
              </p>
              {data.debtList.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {data.debtList.map((d, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg bg-background/40 px-3 py-2 text-sm"
                    >
                      <span>
                        {d.customerName} (Masa {d.tableNumber})
                      </span>
                      <span className="font-semibold">{d.total.toLocaleString("tr-TR")} TL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 text-foreground">
                <BarChart3 className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">En Çok Tüketilen Ürünler</span>
              </div>
              <div className="mt-2 space-y-1">
                {data.topProducts.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">Bugün satış yok.</p>
                ) : (
                  data.topProducts.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="font-semibold text-muted-foreground">{p.qty} Adet</span>
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