import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";
import AppLayout from "@/components/AppLayout";
import CartBar from "@/components/CartBar";
import VariationModal from "@/components/VariationModal";
import { CATEGORIES, KITCHEN_STAGES, isItemSoldOut, getCheckedStages } from "@/lib/menu";
import { getMenuItems } from "@/lib/menuData";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const detectMenuType = (cartItems) => {
  const fixMenu = (cartItems || []).find((item) => item.name && item.name.includes("Fix Menü"));
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
  
  // YETKİ VE GİZLİLİK KONTROLÜ
  const canEdit = user?.role === 'garson' || user?.role === 'kasa' || user?.role === 'admin';
  const hidePrices = user?.role === 'garson'; // Garsonlar fiyat göremez!

  const [menu, setMenu] = useState(null);
  
  // KATEGORİ STATE'LERİ
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].id);
  const [activeSubCat, setActiveSubCat] = useState(null);

  const [cart, setCart] = useState([]);
  const [tableNumber, setTableNumber] = useState("");
  const [orderNote, setOrderNote] = useState(""); 
  const [variationItem, setVariationItem] = useState(null);
  const [sending, setSending] = useState(false);

  const loadMenu = useCallback(async () => {
    try {
      const fetchedMenu = await getMenuItems();
      setMenu(fetchedMenu || []);
    } catch (e) {
      console.error("Menü yüklenirken hata oluştu:", e);
      setMenu([]);
    }
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  useEffect(() => {
    const prev = {};
    const checkOrderUpdates = async () => {
      try {
        const { data: orders, error } = await supabase.from("orders").select("*");
        if (error || !orders) return;

        orders.forEach((o) => {
          const checked = getCheckedStages(o);
          const isCompleted = o.status === "completed";
          const p = prev[o.id];

          if (!p) {
            prev[o.id] = { checked, completed: isCompleted };
            return;
          }

          const who = o.waiterName ? `${o.waiterName} — ` : "";
          checked.forEach((stage) => {
            if (!p.checked.has(stage)) {
              const stageInfo = KITCHEN_STAGES.find((s) => s.stage === stage);
              if (stageInfo) {
                toast({
                  title: `${who}Masa ${o.tableNumber} — ${stageInfo.emoji} ${stageInfo.label} Hazır`,
                });
              }
            }
          });

          if (isCompleted && !p.completed) {
            toast({ title: `${who}Masa ${o.tableNumber} — Servise Hazır ✓` });
          }

          prev[o.id] = { checked, completed: isCompleted };
        });
      } catch (e) {
        console.error("Bildirim kontrol hatası:", e);
      }
    };

    const interval = setInterval(checkOrderUpdates, 3000);
    return () => clearInterval(interval);
  }, [toast]);

  // KATEGORİ TIKLAMA İŞLEMİ (Alt kategorileri yönetir)
  const handleCategoryClick = (catId) => {
    setActiveCat(catId);
    const catObj = CATEGORIES.find(c => c.id === catId);
    if (catObj && catObj.subCategories && catObj.subCategories.length > 0) {
      setActiveSubCat(catObj.subCategories[0].id);
    } else {
      setActiveSubCat(null);
    }
  };

  // YENİ FİLTRELEME SİSTEMİ (DB ile hatasız eşleşme)
  const items = useMemo(() => {
    if (!menu) return [];
    
    const mainCat = CATEGORIES.find(c => c.id === activeCat);
    if (!mainCat) return [];

    let targetDbId = mainCat.dbId || mainCat.id;
    
    if (mainCat.subCategories && activeSubCat) {
      const sub = mainCat.subCategories.find(s => s.id === activeSubCat);
      if (sub) targetDbId = sub.dbId;
    } else if (mainCat.subCategories && mainCat.subCategories.length > 0) {
      targetDbId = mainCat.subCategories[0].dbId;
    }

    // .trim() metodu olası boşluk hatalarını siler ve eşleşmeyi garantiler
    return menu.filter((m) => m.category?.trim() === targetDbId?.trim());
  }, [menu, activeCat, activeSubCat]);


  const addToCart = (item, variation = null) => {
    const name = item.name;
    const variationLabel = variation ? variation.label : "";
    const unitPrice = variation ? variation.price : item.price;
    setCart((prev) => {
      const idx = prev.findIndex((c) => c.name === name && c.variationLabel === variationLabel);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          quantity: next[idx].quantity + 1,
          totalPrice: (next[idx].quantity + 1) * unitPrice,
        };
        return next;
      }
      return [...prev, { name, variationLabel, quantity: 1, unitPrice, totalPrice: unitPrice }];
    });
  };

  const handleProductClick = (item) => {
    if (!canEdit) {
      return toast({ variant: "destructive", title: "Yetkisiz İşlem", description: "Sadece Garson veya Kasiyer sipariş girebilir." });
    }
    if (isItemSoldOut(item)) {
      toast({ variant: "destructive", title: "Tükendi", description: `${item.name} şu anda stokta değil.` });
      return;
    }
    if (item.isSeasonalPriceOnRequest) {
      toast({ title: "Fiyat sorunuz", description: `${item.name} — mevsimlik üründür, fiyat için mutfağa danışın.` });
      return;
    }
    if (item.hasVariations && item.variations?.length) {
      setVariationItem(item);
      return;
    }
    addToCart(item);
  };

  const handleVariationSelect = (variation) => {
    addToCart(variationItem, variation);
    setVariationItem(null);
  };

  const inc = (idx) => {
    if (!canEdit) return;
    setCart((p) => p.map((c, i) => i === idx ? { ...c, quantity: c.quantity + 1, totalPrice: (c.quantity + 1) * c.unitPrice } : c));
  };
  
  const dec = (idx) => {
    if (!canEdit) return;
    setCart((p) => p.map((c, i) => i === idx ? { ...c, quantity: c.quantity - 1, totalPrice: (c.quantity - 1) * c.unitPrice } : c).filter((c) => c.quantity > 0));
  };
  
  const remove = (idx) => {
    if (!canEdit) return;
    setCart((p) => p.filter((_, i) => i !== idx));
  };

  const handleTableChange = (val) => {
    if (!canEdit) return;
    setTableNumber(val);
  };

  const handleSend = async () => {
    if (!canEdit) return;
    if (!tableNumber.trim()) return;
    setSending(true);
    try {
      const newOrder = {
        id: Date.now().toString(),
        tableNumber: tableNumber.trim(),
        menuType: detectMenuType(cart),
        waiterName: user?.name || "Bilinmeyen Garson",
        currentStage: 0,
        stageTimestamps: { 0: new Date().toISOString() },
        items: cart.map((c) => ({
          name: c.name,
          variationLabel: c.variationLabel || "",
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          totalPrice: c.totalPrice,
        })),
        totalAmount: cart.reduce((s, c) => s + c.totalPrice, 0),
        status: "pending",
        created_date: new Date().toISOString(),
        note: orderNote.trim() || null, 
      };

      const { error } = await supabase.from("orders").insert([newOrder]);
      if (error) throw error;

      toast({
        title: "Sipariş mutfağa gönderildi ✓",
        description: `Masa ${tableNumber.trim()} — ${cart.reduce((s, c) => s + c.quantity, 0)} ürün.`,
      });
      
      setCart([]);
      setTableNumber("");
      setOrderNote(""); 
    } catch (e) {
      console.error("Sipariş Gönderme Hatası:", e);
      toast({ 
        variant: "destructive", 
        title: "Gönderilemedi", 
        description: e?.message || e?.details || "Bir hata oluştu." 
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        
        {/* ANA KATEGORİ TABLARI */}
        <div className="border-b border-border bg-card/60">
          <div className="no-scrollbar mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={cn(
                  "select-none whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
                  activeCat === cat.id
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {cat.short}
              </button>
            ))}
          </div>
          
          {/* ALT KATEGORİ TABLARI (Sadece İçecekler veya A la carte seçiliyse görünür) */}
          {CATEGORIES.find(c => c.id === activeCat)?.subCategories && (
            <div className="bg-secondary/20 border-t border-border px-4 py-2 flex gap-2 overflow-x-auto scrollbar-thin shadow-inner">
              {CATEGORIES.find(c => c.id === activeCat).subCategories.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubCat(sub.id)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                    activeSubCat === sub.id 
                      ? "bg-background text-foreground shadow-sm border border-border" 
                      : "bg-transparent text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-7xl px-4 py-5 pb-32">
            <h2 className="mb-4 text-lg font-semibold text-muted-foreground">
              {activeSubCat 
                ? CATEGORIES.find(c => c.id === activeCat)?.subCategories.find(s => s.id === activeSubCat)?.label 
                : CATEGORIES.find(c => c.id === activeCat)?.label
              }
            </h2>
            
            {menu === null ? (
              <div className="flex h-48 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleProductClick(item)}
                    className={cn(
                      "group select-none flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all active:scale-[0.98]",
                      isItemSoldOut(item)
                        ? "cursor-not-allowed border-red-500/30 opacity-50"
                        : "hover:border-primary hover:bg-primary/5"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {item.category === "A la Carte - Balık" || item.category === "Rakı" || item.category === "Şaraplar" ? (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <Waves className="h-5 w-5" />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                          <Plus className="h-5 w-5" />
                        </div>
                      )}
                      <div>
                        <p className="text-[15px] font-medium leading-tight">{item.name}</p>
                        {item.hasVariations && (
                          <p className="text-xs text-primary">Seçenekli</p>
                        )}
                        {item.isSeasonalPriceOnRequest && (
                          <p className="text-xs text-amber-400">Fiyat sorunuz</p>
                        )}
                      </div>
                    </div>
                    
                    {/* FİYAT GÖSTERİM VEYA GİZLEME ALANI */}
                    <div className="text-right">
                      {isItemSoldOut(item) ? (
                        <span className="rounded-lg bg-red-500/15 px-2.5 py-1 text-xs font-bold text-red-400">
                          Tükendi
                        </span>
                      ) : item.isSeasonalPriceOnRequest ? (
                        <span className="text-sm font-semibold text-amber-400">—</span>
                      ) : hidePrices ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary">
                          <Plus className="h-4 w-4" />
                        </div>
                      ) : (
                        <span className="text-base font-bold text-primary">
                          {item.price?.toLocaleString("tr-TR")}
                          <span className="block text-xs font-normal text-muted-foreground">TL</span>
                        </span>
                      )}
                    </div>

                  </button>
                ))}
                {items.length === 0 && (
                  <p className="col-span-full py-10 text-center text-sm text-muted-foreground">
                    Bu kategoride ürün bulunamadı.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <CartBar
          cart={cart}
          tableNumber={tableNumber}
          onTableChange={handleTableChange}
          orderNote={orderNote}
          onNoteChange={setOrderNote}
          onInc={inc}
          onDec={dec}
          onRemove={remove}
          onSend={handleSend}
          sending={sending}
          hidePrices={hidePrices} 
        />
      </div>

      <VariationModal
        item={variationItem}
        onSelect={handleVariationSelect}
        onClose={() => setVariationItem(null)}
        hidePrices={hidePrices} 
      />
    </AppLayout>
  );
}