import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import CartBar from "@/components/CartBar";
import VariationModal from "@/components/VariationModal";
import { CATEGORIES, KITCHEN_STAGES, isItemSoldOut, getCheckedStages } from "@/lib/menu";
import { getMenuItems } from "@/lib/menuData";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Waves, Edit2, Minus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const detectMenuType = (cartItems) => {
  const fixMenu = (cartItems || []).find((item) => item?.name && item.name.includes("Fix Menü"));
  if (!fixMenu) return "individual";
  const name = fixMenu.name.toLowerCase();
  if (name.includes("kebab")) return "kebab_set";
  if (name.includes("pirzola")) return "lamb_set";
  if (name.includes("et")) return "meat_set";
  if (name.includes("tavuk")) return "chicken_set";
  if (name.includes("meze")) return "fixed_meze";
  return "fixed_fish";
};

export default function OrderScreen() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const canEdit = user?.role === 'garson' || user?.role === 'kasa' || user?.role === 'admin';
  const hidePrices = user?.role === 'garson'; 

  const [menu, setMenu] = useState(null);
  const safeCategories = Array.isArray(CATEGORIES) ? CATEGORIES : [];
  const [activeCat, setActiveCat] = useState(safeCategories[0]?.id || "");
  const [activeSubCat, setActiveSubCat] = useState(null);
  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [orderNote, setOrderNote] = useState(""); 
  const [variationItem, setVariationItem] = useState(null);
  const [sending, setSending] = useState(false);

  // AKILLI ÖZEL İŞLEM MODALI STATE'LERİ
  const [isCustomOpen, setIsCustomOpen] = useState(false);
  const [customType, setCustomType] = useState('product'); // 'product' veya 'discount'
  const [customItem, setCustomItem] = useState({ name: "", price: "" });

  const notifyUser = useCallback((title, body) => {
    toast({ title, description: body });
    try { new Audio('/notification.wav').play().catch(() => {}); } catch (e) {}
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body: body || "Yeni sipariş", icon: "/favicon.ico" });
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
      } catch (e) {}
    }
  }, [toast]);

  const loadMenu = useCallback(async () => {
    try {
      const fetchedMenu = await getMenuItems();
      setMenu(fetchedMenu || []);
    } catch (e) { setMenu([]); }
  }, []);

  useEffect(() => { loadMenu(); }, [loadMenu]);

  useEffect(() => {
    const prev = {};
    const checkOrderUpdates = async () => {
      try {
        const { data: orders, error } = await supabase.from("orders").select("*");
        if (error || !orders) return;
        orders.forEach((o) => {
          const checked = getCheckedStages ? getCheckedStages(o) : new Set();
          const isCompleted = o.status === "completed";
          const p = prev[o.id];
          if (!p) { prev[o.id] = { checked, completed: isCompleted }; return; }
          const who = o.waiterName ? `${o.waiterName} - ` : "";
          checked.forEach((stage) => {
            if (!p.checked.has(stage)) {
              const stageInfo = (KITCHEN_STAGES || []).find((s) => s.stage === stage);
              if (stageInfo) notifyUser(`${stageInfo.emoji} ${stageInfo.label} Hazır`, `${who}Masa ${o.tableNumber} için çıktı!`);
            }
          });
          if (isCompleted && !p.completed) notifyUser(`✅ Servise Hazır`, `${who}Masa ${o.tableNumber} siparişi hazırlandı!`);
          prev[o.id] = { checked, completed: isCompleted };
        });
      } catch (e) {}
    };
    const interval = setInterval(checkOrderUpdates, 3000);
    return () => clearInterval(interval);
  }, [notifyUser]);

  const handleCategoryClick = (catId) => {
    setActiveCat(catId);
    const catObj = safeCategories.find(c => c.id === catId);
    if (catObj?.subCategories?.length > 0) setActiveSubCat(catObj.subCategories[0].id);
    else setActiveSubCat(null);
  };

  const activeCatObj = safeCategories.find(c => c.id === activeCat);
  const activeSubCatObj = activeCatObj?.subCategories?.find(s => s.id === activeSubCat);
  const displayTitle = activeSubCatObj ? activeSubCatObj.label : (activeCatObj?.label || "");

  const items = useMemo(() => {
    if (!menu || !activeCatObj) return [];
    let targetDbId = activeCatObj.dbId || activeCatObj.id;
    if (activeCatObj.subCategories && activeSubCatObj) {
      targetDbId = activeSubCatObj.dbId;
    } else if (activeCatObj.subCategories?.length > 0) {
      targetDbId = activeCatObj.subCategories[0].dbId;
    }
    return menu
      .filter((m) => m.category?.trim() === targetDbId?.trim())
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)); 
  }, [menu, activeCatObj, activeSubCatObj]);

  const addToCart = (item, variation = null) => {
    const name = item.name;
    const variationLabel = variation ? variation.label : "";
    const unitPrice = variation ? variation.price : item.price;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.name === name && c.variationLabel === variationLabel);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1, totalPrice: (next[idx].quantity + 1) * unitPrice };
        return next;
      }
      return [...prev, { name, variationLabel, quantity: 1, unitPrice, totalPrice: unitPrice }];
    });
  };

  // İNDİRİM VEYA ÜRÜN EKLEME FONKSİYONU
  const submitCustomItem = () => {
    if (!customItem?.name?.trim()) return;
    
    const rawPrice = Number(customItem.price) || 0;
    // Eğer İndirim modundaysa fiyatı negatife çevirir
    const finalPrice = customType === 'discount' ? -Math.abs(rawPrice) : Math.abs(rawPrice);
    const prefix = customType === 'discount' ? '⬇ İNDİRİM:' : '*ÖZEL*';

    addToCart({ 
      name: `${prefix} ${customItem.name.trim()}`, 
      price: finalPrice 
    });

    setIsCustomOpen(false);
    setCustomItem({ name: "", price: "" });
    setCustomType('product'); // Modeli sıfırla
    toast({ 
      title: customType === 'discount' ? "İndirim Uygulandı ✓" : "Özel Ürün Eklendi ✓", 
      description: "Hesap toplamı güncellendi." 
    });
  };

  const handleProductClick = (item) => {
    if (!canEdit) return toast({ variant: "destructive", title: "Yetkisiz", description: "Sadece Garson/Kasiyer girebilir." });
    if (isItemSoldOut && isItemSoldOut(item)) return toast({ variant: "destructive", title: "Tükendi" });
    if (item.isSeasonalPriceOnRequest) return toast({ title: "Fiyat sorunuz" });
    if (item.hasVariations && item.variations?.length) return setVariationItem(item);
    addToCart(item);
  };

  const inc = (idx) => { setCart((p) => p.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice } : c)); };
  const dec = (idx) => { setCart((p) => p.map((c, i) => i === idx ? { ...c, quantity: c.quantity - 1, totalPrice: (c.quantity - 1) * c.unitPrice } : c).filter((c) => c.quantity > 0)); };
  const remove = (idx) => { setCart((p) => p.filter((_, i) => i !== idx)); };
  const handleTableChange = (val) => { setTableNumber(val); };

  // YILDIRIM HIZI (OPTIMISTIC UI) İLE GÖNDERME
  const handleSend = async () => {
    if (!canEdit || !tableNumber?.trim()) return;
    
    setSending(true);
    const backupCart = [...cart];
    const backupTable = tableNumber;
    const backupNote = orderNote;
    
    // İnterneti BEKLEMEDEN ekranı garson için anında temizliyoruz!
    setCart([]);
    setTableNumber("");
    setOrderNote(""); 
    
    try {
      const newOrder = {
        id: Date.now().toString(), tableNumber: backupTable.trim(),
        menuType: detectMenuType(backupCart), waiterName: user?.name || "Garson",
        currentStage: 0, stageTimestamps: { 0: new Date().toISOString() },
        items: backupCart.map((c) => ({ name: c.name, variationLabel: c.variationLabel || "", quantity: c.quantity, unitPrice: c.unitPrice, totalPrice: c.totalPrice })),
        totalAmount: backupCart.reduce((s, c) => s + (c.totalPrice || 0), 0),
        status: "pending", created_date: new Date().toISOString(), note: backupNote?.trim() || null, 
      };

      const { error } = await supabase.from("orders").insert([newOrder]);
      if (error) throw error;
      
      toast({ title: "Sipariş mutfağa gönderildi ✓" });
    } catch (e) {
      // Hata olursa sildiğimiz sepeti garsona geri veriyoruz (Zırh)
      setCart(backupCart);
      setTableNumber(backupTable);
      setOrderNote(backupNote);
      toast({ variant: "destructive", title: "Gönderilemedi", description: "Bağlantı hatası, tekrar deneyin." });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="border-b border-border bg-card/60">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
            {safeCategories.map((cat) => (
              <button
                key={cat.id} onClick={() => handleCategoryClick(cat.id)}
                className={cn("select-none whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  activeCat === cat.id ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground")}
              >
                {cat.short}
              </button>
            ))}
          </div>
          {activeCatObj?.subCategories?.length > 0 && (
            <div className="bg-secondary/20 border-t border-border px-4 py-2 flex gap-2 overflow-x-auto scrollbar-thin shadow-inner">
              {activeCatObj.subCategories.map(sub => (
                <button
                  key={sub.id} onClick={() => setActiveSubCat(sub.id)}
                  className={cn("flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeSubCat === sub.id ? "bg-background text-foreground shadow-sm border border-border" : "bg-transparent text-muted-foreground hover:bg-secondary")}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-5 pb-32">
            
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-muted-foreground">
                {displayTitle}
              </h2>
              <Button onClick={() => setIsCustomOpen(true)} variant="outline" size="sm" className="border-dashed border-2 border-primary text-primary hover:bg-primary/10">
                <Edit2 className="w-4 h-4 mr-2" /> Özel İşlem (İndirim / Ekle)
              </Button>
            </div>
            
            {menu === null ? (
              <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => {
                  const soldOut = isItemSoldOut ? isItemSoldOut(item) : item.isSoldOut;
                  return (
                    <button key={item.id} onClick={() => handleProductClick(item)} className={cn("group select-none flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-[0.98]", soldOut ? "cursor-not-allowed border-red-500/30 opacity-50" : "hover:border-primary hover:bg-primary/5")}>
                      <div className="flex items-center gap-3">
                        {item.category === "A la Carte - Balık" || item.category === "Rakı" || item.category === "Şaraplar" ? (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Waves className="h-5 w-5" /></div>
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"><Plus className="h-5 w-5" /></div>
                        )}
                        <div>
                          <p className="text-[15px] font-medium leading-tight">{item.name}</p>
                          {item.hasVariations && <p className="text-xs text-primary">Seçenekli</p>}
                          {item.isSeasonalPriceOnRequest && <p className="text-xs text-amber-400">Fiyat sorunuz</p>}
                        </div>
                      </div>
                      <div className="text-right">
                        {soldOut ? ( <span className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">Tükendi</span> ) 
                          : item.isSeasonalPriceOnRequest ? ( <span className="text-sm font-semibold text-amber-400">—</span> ) 
                          : hidePrices ? ( <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"><Plus className="h-4 w-4" /></div> ) 
                          : ( <span className="text-base font-bold text-primary">{item.price?.toLocaleString("tr-TR")}<span className="block text-xs font-normal text-muted-foreground">TL</span></span> )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <CartBar cart={cart} tableNumber={tableNumber} onTableChange={handleTableChange} orderNote={orderNote} onNoteChange={setOrderNote} onInc={inc} onDec={dec} onRemove={remove} onSend={handleSend} sending={sending} hidePrices={hidePrices} />
      </div>

      <VariationModal item={variationItem} onSelect={handleVariationSelect} onClose={() => setVariationItem(null)} hidePrices={hidePrices} />
      
      {/* İKİ MODLU ÖZEL İŞLEM MODALI */}
      <Dialog open={isCustomOpen} onOpenChange={(val) => { setIsCustomOpen(val); if(!val) setCustomType('product'); }}>
        <DialogContent className="sm:max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle>Özel İşlem Menüsü</DialogTitle></DialogHeader>
          
          <div className="flex gap-2 pt-2">
            <Button 
              variant={customType === 'product' ? 'default' : 'outline'} 
              onClick={() => setCustomType('product')} 
              className={cn("flex-1", customType === 'product' && "bg-primary")}
            >
              <Plus className="w-4 h-4 mr-1.5"/> Ürün Ekle
            </Button>
            <Button 
              variant={customType === 'discount' ? 'default' : 'outline'} 
              onClick={() => setCustomType('discount')} 
              className={cn("flex-1", customType === 'discount' && "bg-amber-500 hover:bg-amber-600 text-white border-transparent")}
            >
              <Minus className="w-4 h-4 mr-1.5"/> İndirim Yap
            </Button>
          </div>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>
                {customType === 'product' ? 'İstek (Örn: 1.5 Full Karışık)' : 'İndirim Nedeni (Örn: Fix Menü Farkı)'}
              </Label>
              <Input autoFocus placeholder={customType === 'product' ? "Ne getirelim?" : "Neden indirim yapılıyor?"} value={customItem?.name || ""} onChange={(e) => setCustomItem({...customItem, name: e.target.value})} />
            </div>
            
            <div className="space-y-1.5">
              <Label>{customType === 'product' ? 'Fiyat (TL)' : 'İndirilecek Tutar (TL)'}</Label>
              <Input type="number" placeholder={customType === 'product' ? "Örn: 650" : "Örn: 400"} value={customItem?.price || ""} onChange={(e) => setCustomItem({...customItem, price: e.target.value})} />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 mt-2">
            <Button variant="outline" onClick={() => setIsCustomOpen(false)}>İptal</Button>
            <Button 
              onClick={submitCustomItem} 
              className={customType === 'discount' ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}
            >
              {customType === 'discount' ? 'İndirimi Uygula' : 'Sepete Ekle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}