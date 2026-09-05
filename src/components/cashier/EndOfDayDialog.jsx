import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { aggregateProducts, groupDebtByTable } from "@/lib/cashier";
import { Loader2, Wallet, AlertTriangle, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

// GECE 05:00 İŞ GÜNÜ MANTIĞI (Kıbrıs / Yerel Saate Göre)
const getBusinessDate = (dateInput) => {
  const d = new Date(dateInput || new Date());
  d.setHours(d.getHours() - 5);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function EndOfDayDialog({ open, onClose }) {
  const { toast } = useToast();
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);

  const todayBusinessDate = getBusinessDate(new Date());

  useEffect(() => {
    if (!open) return;
    
    (async () => {
      try {
        const { data: list, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_date", { ascending: false });

        if (error) throw error;

        // 1. Saat 05:00 kuralına göre "Bugüne" ait olanları bul
        const todayOrders = (list || []).filter((o) => o.paymentStatus && getBusinessDate(o.paidAt || o.created_date) === todayBusinessDate);
        
        const dailyTotal = todayOrders.reduce((s, o) => s + (Number(o.paid_amount) || 0), 0);
        const debtOrders = todayOrders.filter((o) => o.paymentStatus === "debt");
        
        const debtTotal = debtOrders.reduce((s, o) => {
          const total = Number(o.totalAmount) || 0;
          const paid = Number(o.paid_amount) || 0;
          return s + (total > paid ? total - paid : 0);
        }, 0);

        const formattedDebtOrders = debtOrders.map(o => ({
          ...o, totalAmount: (Number(o.totalAmount) || 0) - (Number(o.paid_amount) || 0)
        })).filter(o => o.totalAmount > 0);

        setData({
          dailyTotal,
          debtTotal,
          debtList: groupDebtByTable(formattedDebtOrders),
          topProducts: aggregateProducts(todayOrders),
        });
      } catch (err) {
        console.error("Gün sonu raporu hatası:", err);
        setData({ dailyTotal: 0, debtTotal: 0, debtList: [], topProducts: [] });
      }
    })();
  }, [open, todayBusinessDate]);

  // PATRON EKRANINA Z RAPORUNU MÜHÜRLEME (KAYDETME) İŞLEMİ
  const handleSaveEOD = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("eod_reports")
        .upsert({ 
          business_date: todayBusinessDate, 
          total_revenue: data.dailyTotal 
        }, { onConflict: 'business_date' });

      if (error) throw error;

      toast({ title: "Z Raporu Alındı ✓", description: "Gün sonu cirosu kilitlendi ve Patron ekranına işlendi." });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Gün sonu kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg bg-card border-border p-6 rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Gün Sonu Raporu</DialogTitle>
        </DialogHeader>

        {!data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="flex items-center gap-2 text-emerald-500">
                <Wallet className="h-5 w-5" />
                <span className="text-sm font-semibold">Günlük Genel Toplam (Kasa)</span>
              </div>
              <p className="mt-1 text-3xl font-black text-emerald-500">
                {data.dailyTotal.toLocaleString("tr-TR")} TL
              </p>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-center gap-2 text-amber-500">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm font-semibold">Müşteri Borcu Toplamı (Veresiye)</span>
              </div>
              <p className="mt-1 text-2xl font-bold text-amber-500">
                {data.debtTotal.toLocaleString("tr-TR")} TL
              </p>
              
              {data.debtList.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {data.debtList.map((d, i) => (
                    <div key={i} className="flex items-center justify-between rounded-lg bg-background/50 px-3 py-2 text-sm border border-border">
                      <span className="font-medium text-foreground">
                        {d.customerName} <span className="text-muted-foreground">(Masa {d.tableNumber})</span>
                      </span>
                      <span className="font-bold text-amber-500">{d.total.toLocaleString("tr-TR")} TL</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                    <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-muted/50">
                      <span className="flex items-center gap-2 font-medium">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15 text-xs font-bold text-primary">{i + 1}</span>
                        {p.name}
                      </span>
                      <span className="font-bold text-muted-foreground">{p.qty} Adet</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-border pt-4 mt-2">
               <Button 
                 onClick={handleSaveEOD} 
                 disabled={saving}
                 className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-bold text-base shadow-lg shadow-primary/20"
               >
                 {saving ? "Kaydediliyor..." : <><Lock className="w-5 h-5 mr-2"/> Günü Kapat ve Arşivle (Z Raporu)</>}
               </Button>
               <p className="text-[10px] text-center text-muted-foreground mt-2 font-semibold uppercase tracking-wider">
                 Bu işlem ciroyu kilitler ve patron ekranına işler.
               </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}