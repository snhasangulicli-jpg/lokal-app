import { useState } from "react";
import { Receipt, Users, Printer, PencilLine } from "lucide-react";
import { printReceipt } from "@/lib/printer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function TableCard({ table, onClose }) {
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  const handlePrint = () => {
    printReceipt(table, "CUSTOMER");
  };

  // KASİYER İNDİRİM / FİYAT DÜZENLEME FONKSİYONU
  const handleAddAdjustment = async () => {
    if (!desc.trim() || !amount) return;
    setSaving(true);
    try {
      const numAmount = Number(amount);
      
      // Bu işlem mutfağa gitmez, "completed" olarak direkt masanın hesabına yansır
      const newOrder = {
        id: Date.now().toString(),
        tableNumber: table.tableNumber,
        waiterName: "Kasa (Düzenleme)",
        status: "completed", 
        currentStage: 8,
        items: [{
          name: numAmount < 0 ? `⬇ ${desc.trim()}` : `➕ ${desc.trim()}`,
          variationLabel: "",
          quantity: 1,
          unitPrice: numAmount,
          totalPrice: numAmount
        }],
        totalAmount: numAmount,
        created_date: new Date().toISOString()
      };

      const { error } = await supabase.from("orders").insert([newOrder]);
      if (error) throw error;

      toast({ title: "Başarılı", description: "Hesap başarıyla güncellendi." });
      setIsEditOpen(false);
      setDesc("");
      setAmount("");
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "İşlem kaydedilemedi." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow relative">
        
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="text-sm font-bold">M{table.tableNumber}</span>
            </div>
            <div>
              <p className="text-sm font-semibold">Masa {table.tableNumber}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" /> {table.orderCount} sipariş
              </p>
            </div>
          </div>
          
          {/* YENİ DÜZENLE / İNDİRİM BUTONU */}
          <button 
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 transition-colors"
          >
            <PencilLine className="h-3.5 w-3.5" /> Fiyat / İndirim
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-1">
          {table.items.map((item, i) => {
            const isZero = item.totalPrice === 0;
            const isDiscount = item.totalPrice < 0;
            return (
              <div key={i} className={`flex items-center justify-between text-sm ${isZero ? 'text-amber-500 font-bold' : isDiscount ? 'text-emerald-500 font-bold' : ''}`}>
                <span className="truncate pr-2">
                  <span className="font-bold mr-1">{item.quantity}×</span> {item.name}
                  {item.variationLabel ? <span className="text-muted-foreground text-xs block truncate ml-4">- {item.variationLabel}</span> : ""}
                </span>
                <span className="shrink-0 font-medium">
                  {item.totalPrice.toLocaleString("tr-TR")} TL
                </span>
              </div>
            )
          })}
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Receipt className="h-4 w-4" /> Genel Toplam
            </span>
            <span className="text-lg font-black text-primary">
              {table.totalAmount.toLocaleString("tr-TR")} TL
            </span>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-sm font-bold text-foreground transition-colors hover:bg-secondary active:scale-[0.98]"
              title="Müşteri Adisyonu Yazdır"
            >
              <Printer className="h-4 w-4" /> Yazdır
            </button>
            
            <button
              onClick={() => onClose(table)}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
            >
              Hesabı Kapat
            </button>
          </div>
        </div>
      </div>

      {/* KASİYER DÜZENLEME MODALI */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle>Adisyon Düzenleme</DialogTitle>
            <DialogDescription>
              0 TL'lik özel ürünlere fiyat ekleyebilir veya başa eksi (-) koyarak masaya indirim uygulayabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Açıklama (Ne ücreti/indirimi?)</Label>
              <Input 
                placeholder="Örn: Fix Menü İndirimi veya Özel Salata" 
                value={desc} 
                onChange={(e) => setDesc(e.target.value)} 
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Tutar (TL) — <span className="text-xs text-amber-500 font-bold">İndirim için başa eksi (-) koyun</span></Label>
              <Input 
                type="number" 
                placeholder="Örn: -400 veya 150" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>İptal</Button>
            <Button onClick={handleAddAdjustment} disabled={saving || !amount || !desc.trim()} className="bg-amber-500 hover:bg-amber-600 text-white">
              {saving ? "Ekleniyor..." : "Hesaba Yansıt"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}