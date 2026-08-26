import { useState } from "react";
import { Receipt, Users, Printer, PencilLine, Trash2, Edit2, Plus } from "lucide-react";
import { printReceipt } from "@/lib/printer";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
        .eq("tableNumber", table.tableNumber);
        
      if (error) throw error;
      
      // Masaya ait aktif (iptal edilmemiş ve ödenmemiş) siparişleri getir
      const activeOrders = (data || []).filter(o => o.status !== "cancelled" && o.paymentStatus !== "paid");
      setRawOrders(activeOrders);
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

  // 2. ÜRÜN SİLME (ÖRN: FIX MENÜYÜ İPTAL EDİp A LA CARTE'A GEÇİŞ İÇİN)
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
        status: "completed", // "completed" yapıyoruz ki mutfak fiş çıkarmasın, sadece kasada görünsün.
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
      <div className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-md transition-shadow relative">
        
        {/* ÜST BİLGİ VE DÜZENLE BUTONU */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary font-black text-base shadow-sm">
              M{table.tableNumber}
            </div>
            <div>
              <p className="text-base font-bold">Masa {table.tableNumber}</p>
              <p className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                <Users className="h-3.5 w-3.5" /> {table.orderCount} aktif sipariş
              </p>
            </div>
          </div>
          
          <Button 
            variant="outline"
            size="sm"
            onClick={handleOpenEdit}
            className="rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 hover:text-amber-700 font-bold h-9 px-3"
          >
            <PencilLine className="h-4 w-4 mr-1.5" /> Adisyonu Düzenle
          </Button>
        </div>

        {/* ANA KART ÜZERİNDEKİ ÜRÜN LİSTESİ */}
        <div className="min-h-0 flex-1 space-y-2 mb-4">
          {table.items.map((item, i) => {
            const isZero = item.totalPrice === 0;
            const isDiscount = item.totalPrice < 0;
            return (
              <div key={i} className={`flex items-center justify-between text-sm p-2 rounded-xl bg-secondary/30 border border-border/40 ${isZero ? 'text-amber-500 font-bold' : isDiscount ? 'text-emerald-600 font-bold' : ''}`}>
                <span className="truncate pr-2">
                  <Badge variant="outline" className="mr-1.5 font-bold">{item.quantity}x</Badge> {item.name}
                  {item.variationLabel ? <span className="text-muted-foreground text-xs block truncate ml-6">- {item.variationLabel}</span> : ""}
                </span>
                <span className="shrink-0 font-bold">
                  {item.totalPrice.toLocaleString("tr-TR")} TL
                </span>
              </div>
            )
          })}
        </div>

        {/* ALT TOPLAM VE KAPATMA BUTONLARI */}
        <div className="border-t border-border pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Receipt className="h-4 w-4" /> Genel Toplam
            </span>
            <span className="text-xl font-black text-primary">
              {table.totalAmount.toLocaleString("tr-TR")} TL
            </span>
          </div>
          
          <div className="flex gap-2.5">
            <Button
              variant="outline"
              onClick={handlePrint}
              className="flex-1 rounded-xl h-11 font-bold border-border bg-secondary/30 hover:bg-secondary"
            >
              <Printer className="h-4 w-4 mr-2" /> Yazdır
            </Button>
            
            <Button
              onClick={() => onClose(table)}
              className="flex-1 rounded-xl h-11 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-md shadow-primary/20"
            >
              Hesabı Kapat
            </Button>
          </div>
        </div>
      </div>

      {/* KASİYER ADİSYON DÜZENLEME MODALI */}
      <Dialog open={isEditOpen} onOpenChange={(val) => { setIsEditOpen(val); setShowAddRow(false); }}>
        <DialogContent className="sm:max-w-md bg-card border-border max-h-[90vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Adisyon Detayı — Masa {table.tableNumber}</DialogTitle>
            <DialogDescription className="text-sm">
              Ürünlerin fiyatlarını değiştirebilir, silebilir veya hesaba yeni indirim satırı ekleyebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            {loadingOrders ? (
              <p className="text-sm text-muted-foreground text-center py-6">Ürünler yükleniyor...</p>
            ) : (
              <div className="space-y-3">
                {rawOrders.map((order) => (
                  <div key={order.id} className="space-y-2 border-b border-border pb-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-secondary/40 p-3 rounded-2xl border border-border/60 shadow-sm">
                        <div className="flex-1 pr-2">
                          <p className="text-sm font-bold leading-tight">
                            {item.quantity}x {item.name}
                          </p>
                          <p className={`text-xs font-black mt-1 ${item.unitPrice === 0 ? 'text-amber-500' : 'text-primary'}`}>
                            {item.totalPrice} TL
                          </p>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-amber-600 hover:bg-amber-500/20"
                            onClick={() => handleUpdatePrice(order, idx)}
                            title="Fiyatı Değiştir"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="secondary" 
                            size="icon" 
                            className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/20"
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
                className="w-full h-12 rounded-2xl border-dashed border-2 font-bold" 
                onClick={() => setShowAddRow(true)}
              >
                <Plus className="w-4 h-4 mr-2" /> Yeni Satır / İndirim Ekle
              </Button>
            ) : (
              <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl space-y-3 mt-4">
                <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Adisyona Satır Ekle</p>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Açıklama</Label>
                  <Input 
                    placeholder="Örn: Fix Menü İndirimi" 
                    value={newRowName} 
                    onChange={(e) => setNewRowName(e.target.value)} 
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Tutar (TL) — <span className="text-destructive">İndirim için başa (-) koyun</span></Label>
                  <Input 
                    type="number" 
                    placeholder="Örn: -400" 
                    value={newRowPrice} 
                    onChange={(e) => setNewRowPrice(e.target.value)} 
                    className="h-11 rounded-xl"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowAddRow(false)}>İptal</Button>
                  <Button size="sm" onClick={handleAddRow} disabled={addingRow} className="rounded-xl font-bold">
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