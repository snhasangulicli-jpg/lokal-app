import { useState } from "react";
import { Receipt, Users, Printer, PencilLine, Trash2, Edit2, Plus, Minus } from "lucide-react";
import { printReceipt } from "@/lib/printer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export default function TableCard({ table, onClose }) {
  const { toast } = useToast();
  
  // DÜZENLEME MODALI STATE'LERİ
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [rawOrders, setRawOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // YENİ SATIR (İNDİRİM/EKSTRA) STATE'LERİ
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRowName, setNewRowName] = useState("");
  const [newRowPrice, setNewRowPrice] = useState("");
  const [addingRow, setAddingRow] = useState(false);

  const handlePrint = () => {
    printReceipt(table, "CUSTOMER");
  };

  // MASANIN ARKA PLANDAKİ GERÇEK SİPARİŞLERİNİ ÇEK
  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("tableNumber", table.tableNumber)
        .eq("status", "pending")
        .order("created_date", { ascending: true });
      if (error) throw error;
      setRawOrders(data || []);
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Adisyon detayları çekilemedi." });
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenEdit = () => {
    setIsEditOpen(true);
    fetchOrders();
  };

  // 1. FİYAT DÜZELTME (ÖRN: 0 TL'LİK ÜRÜNE FİYAT YAZMA VEYA FİYAT DEĞİŞTİRME)
  const handleUpdatePrice = async (order, itemIdx) => {
    const item = order.items[itemIdx];
    const newPriceStr = window.prompt(`"${item.name}" için yeni BİRİM fiyatını girin:`, item.unitPrice);
    
    if (newPriceStr === null || newPriceStr.trim() === "") return; // İptal edildi
    
    const newPrice = Number(newPriceStr);
    if (isNaN(newPrice)) return alert("Lütfen geçerli bir rakam girin!");

    const updatedItems = [...order.items];
    updatedItems[itemIdx].unitPrice = newPrice;
    updatedItems[itemIdx].totalPrice = newPrice * updatedItems[itemIdx].quantity;

    const newTotal = updatedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    try {
      await supabase.from("orders").update({ items: updatedItems, totalAmount: newTotal }).eq("id", order.id);
      window.location.reload(); // ANINDA GÜNCELLEME İÇİN SAYFAYI TAZELER
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Fiyat güncellenemedi." });
    }
  };

  // 2. ÜRÜN SİLME (ÖRN: FIX MENÜYÜ İPTAL EDİP A LA CARTE'A GEÇİŞ İÇİN)
  const handleDeleteItem = async (order, itemIdx) => {
    const item = order.items[itemIdx];
    if (!window.confirm(`DİKKAT: "${item.name}" adlı ürünü hesaptan tamamen silmek istediğinize emin misiniz?`)) return;

    const updatedItems = [...order.items];
    updatedItems.splice(itemIdx, 1); // Ürünü diziden çıkar
    const newTotal = updatedItems.reduce((acc, curr) => acc + curr.totalPrice, 0);

    try {
      if (updatedItems.length === 0) {
        // Eğer siparişteki son ürünü de sildiyse, tüm siparişi ekrandan kaldır
        await supabase.from("orders").update({ status: "cancelled", totalAmount: 0 }).eq("id", order.id);
      } else {
        await supabase.from("orders").update({ items: updatedItems, totalAmount: newTotal }).eq("id", order.id);
      }
      window.location.reload(); 
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Ürün silinemedi." });
    }
  };

  // 3. GENEL İNDİRİM VEYA EKSTRA HİZMET EKLEME
  const handleAddRow = async () => {
    if (!newRowName.trim() || !newRowPrice) return;
    setAddingRow(true);
    const numPrice = Number(newRowPrice);

    try {
      const newOrder = {
        id: Date.now().toString(),
        tableNumber: table.tableNumber,
        waiterName: "Kasa (Düzenleme)",
        status: "pending", 
        currentStage: 8,
        items: [{
          name: numPrice < 0 ? `⬇ İNDİRİM: ${newRowName.trim()}` : `➕ ${newRowName.trim()}`,
          variationLabel: "",
          quantity: 1,
          unitPrice: numPrice,
          totalPrice: numPrice
        }],
        totalAmount: numPrice,
        created_date: new Date().toISOString()
      };
      
      const { error } = await supabase.from("orders").insert([newOrder]);
      if (error) throw error;
      
      window.location.reload(); 
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Satır eklenemedi." });
    } finally {
      setAddingRow(false);
    }
  };

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm hover:shadow-md transition-shadow relative">
        
        {/* ÜST BİLGİ VE DÜZENLE BUTONU */}
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
          
          <button 
            onClick={handleOpenEdit}
            className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-500/20 transition-colors"
          >
            <PencilLine className="h-3.5 w-3.5" /> Adisyonu Düzenle
          </button>
        </div>

        {/* ANA KART ÜZERİNDEKİ ÜRÜN LİSTESİ */}
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

        {/* ALT TOPLAM VE KAPATMA BUTONLARI */}
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

      {/* KASİYER ADİSYON DÜZENLEME MODALI */}
      <Dialog open={isEditOpen} onOpenChange={(val) => { setIsEditOpen(val); setShowAddRow(false); }}>
        <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adisyon Detayı — Masa {table.tableNumber}</DialogTitle>
            <DialogDescription>
              Ürünlerin fiyatlarını değiştirebilir, silebilir veya hesaba yeni indirim satırı ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {loadingOrders ? (
              <p className="text-sm text-muted-foreground text-center py-4">Ürünler yükleniyor...</p>
            ) : (
              <div className="space-y-3">
                {rawOrders.map((order) => (
                  <div key={order.id} className="space-y-1 border-b border-border pb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-secondary/20 p-2 rounded-lg border border-border/50">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-semibold leading-tight">
                            {item.quantity}x {item.name}
                          </p>
                          <p className={`text-xs font-bold mt-0.5 ${item.unitPrice === 0 ? 'text-amber-500' : 'text-primary'}`}>
                            {item.totalPrice} TL
                          </p>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
                            onClick={() => handleUpdatePrice(order, idx)}
                            title="Fiyatı Değiştir"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteItem(order, idx)}
                            title="Ürünü Sil"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* YENİ SATIR / İNDİRİM EKLEME KISMI */}
            {!showAddRow ? (
              <Button 
                variant="outline" 
                className="w-full border-dashed border-2" 
                onClick={() => setShowAddRow(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Yeni Satır / İndirim Ekle
              </Button>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 p-3 rounded-xl space-y-3 mt-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Adisyona Satır Ekle</p>
                <div className="space-y-1.5">
                  <Label className="text-xs">Açıklama</Label>
                  <Input 
                    placeholder="Örn: Fix Menü İndirimi" 
                    value={newRowName} 
                    onChange={(e) => setNewRowName(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Tutar (TL) — <span className="font-bold text-destructive">İndirim için başa (-) koyun</span></Label>
                  <Input 
                    type="number" 
                    placeholder="Örn: -400" 
                    value={newRowPrice} 
                    onChange={(e) => setNewRowPrice(e.target.value)} 
                    className="h-9"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddRow(false)}>İptal</Button>
                  <Button size="sm" onClick={handleAddRow} disabled={addingRow}>
                    {addingRow ? "Ekleniyor..." : "Hesaba Ekle"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}