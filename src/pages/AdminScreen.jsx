import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMenuItems, migrateMenuToSupabase } from "@/lib/menuData";
import { CATEGORIES } from "@/lib/menu"; 
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Database, Search, Edit2, Plus, Trash2, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Menü dosyasından veritabanı ID'lerini çekiyoruz
const CATEGORY_OPTIONS = [];
CATEGORIES.forEach(c => {
  if (c.subCategories) {
    c.subCategories.forEach(sub => {
      CATEGORY_OPTIONS.push({ id: sub.dbId, label: `${c.label} > ${sub.label}` });
    });
  } else {
    if (c.dbId) CATEGORY_OPTIONS.push({ id: c.dbId, label: c.label });
  }
});

export default function AdminScreen() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // MODAL STATE'LERİ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); 
  
  // Ürün Formu Taslağı
  const defaultItem = {
    id: null,
    name: "",
    category: CATEGORY_OPTIONS[0]?.id || "",
    price: "",
    stock: "",
    isSoldOut: false,
    isSeasonalPriceOnRequest: false,
    hasVariations: false,
    variations: []
  };
  
  const [currentItem, setCurrentItem] = useState(defaultItem);

  const loadData = async () => {
    setLoading(true);
    const data = await getMenuItems();
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setCurrentItem(defaultItem);
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setModalMode("edit");
    setCurrentItem({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      stock: item.stock !== null && item.stock !== undefined ? item.stock : "",
      isSoldOut: item.isSoldOut || false,
      isSeasonalPriceOnRequest: item.isSeasonalPriceOnRequest || false,
      hasVariations: item.hasVariations || false,
      variations: item.variations || []
    });
    setIsModalOpen(true);
  };

  // --- VARYASYON (SEÇENEK) YÖNETİMİ ---
  const handleAddVariation = () => {
    setCurrentItem(prev => ({
      ...prev,
      hasVariations: true,
      variations: [...(prev.variations || []), { label: "", price: 0 }]
    }));
  };

  const handleVariationChange = (index, field, value) => {
    const newVars = [...currentItem.variations];
    newVars[index][field] = field === 'price' ? Number(value) : value;
    setCurrentItem(prev => ({ ...prev, variations: newVars }));
  };

  const handleRemoveVariation = (index) => {
    const newVars = currentItem.variations.filter((_, i) => i !== index);
    setCurrentItem(prev => ({ 
      ...prev, 
      variations: newVars,
      hasVariations: newVars.length > 0
    }));
  };

  // --- KAYDETME MANTIĞI (Hata Korumalı) ---
  const handleSave = async () => {
    if (!currentItem.name.trim() || !currentItem.category) {
      return toast({ variant: "destructive", title: "Eksik Bilgi", description: "Lütfen ürün adı ve kategorisini girin." });
    }
    
    try {
      const parsedStock = currentItem.stock === "" || currentItem.stock === null ? null : parseInt(currentItem.stock, 10);
      
      const payload = {
        name: currentItem.name.trim(),
        category: currentItem.category,
        price: Number(currentItem.price) || 0,
        "isSoldOut": currentItem.isSoldOut,
        "isSeasonalPriceOnRequest": currentItem.isSeasonalPriceOnRequest,
        "hasVariations": currentItem.variations.length > 0,
        variations: currentItem.variations, 
        stock: parsedStock
      };

      let dbError = null;

      if (modalMode === "add") {
        const newId = `item-${Math.random().toString(36).substr(2, 9)}`;
        const { error } = await supabase.from('menu_items').insert([{ id: newId, ...payload }]);
        dbError = error;
      } else {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', currentItem.id);
        dbError = error;
      }

      // Supabase eğer Array gönderdiğimiz için hata verirse, metin (JSON String) olarak ikinci kez dener.
      if (dbError && (dbError.message.includes("type") || dbError.message.includes("syntax"))) {
        const fallbackPayload = { ...payload, variations: JSON.stringify(currentItem.variations) };
        if (modalMode === "add") {
          const newId = `item-${Math.random().toString(36).substr(2, 9)}`;
          const { error } = await supabase.from('menu_items').insert([{ id: newId, ...fallbackPayload }]);
          dbError = error;
        } else {
          const { error } = await supabase.from('menu_items').update(fallbackPayload).eq('id', currentItem.id);
          dbError = error;
        }
      }

      if (dbError) throw dbError;

      toast({ title: "Başarılı", description: "Ürün güncellendi." });
      setIsModalOpen(false);
      loadData();
    } catch (e) {
      console.error("Kayıt Hatası Detayı:", e);
      toast({ 
        variant: "destructive", 
        title: "Veritabanı Hatası", 
        description: e.message || "İşlem reddedildi. F12 Konsoluna bakın." 
      });
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`"${name}" adlı ürünü tamamen silmek istediğinize emin misiniz?`)) return;

    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Silindi", description: "Ürün menüden kaldırıldı." });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Ürün silinemedi." });
    }
  };

  const handleMigrate = async () => {
    if (!window.confirm("Bu işlem eski CSV dosyasındaki tüm verileri Supabase veritabanına kopyalayacak. Emin misiniz?")) return;
    setMigrating(true);
    const result = await migrateMenuToSupabase();
    setMigrating(false);

    if (result.success) {
      toast({ title: "Sihir Gerçekleşti! ✨", description: `${result.count} ürün başarıyla veritabanına taşındı.` });
      loadData();
    } else {
      toast({ variant: "destructive", title: "Aktarım Başarısız", description: result.error });
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex h-full flex-col p-4 md:p-6 mx-auto max-w-6xl">
        
        {/* Üst Kısım */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Gelişmiş Menü Yönetimi</h1>
            <p className="text-sm text-muted-foreground">Ürünleri, kategorileri, stokları ve seçenekleri düzenleyin.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <Button onClick={openAddModal} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Yeni Ürün Ekle
            </Button>
            <Button 
              onClick={handleMigrate} 
              disabled={migrating}
              variant="outline"
              className="w-full sm:w-auto bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30"
            >
              {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              {migrating ? "Aktarılıyor..." : "İçe Aktar (CSV)"}
            </Button>
          </div>
        </div>

        {/* Arama */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ürün adı veya kategori ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12 bg-background/50 border-border"
          />
        </div>

        {/* Liste */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm">
          <div className="hidden md:grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/40 font-bold text-sm text-muted-foreground">
            <div className="col-span-4">Ürün Adı & Özellik</div>
            <div className="col-span-3">Kategori</div>
            <div className="col-span-2 text-right">Fiyat (TL)</div>
            <div className="col-span-1 text-center">Stok</div>
            <div className="col-span-2 text-right">İşlemler</div>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
               <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredItems.length === 0 ? (
               <div className="text-center py-10 text-muted-foreground">Ürün bulunamadı.</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border-b border-border items-center hover:bg-muted/20 transition-colors">
                  
                  <div className="col-span-1 md:col-span-4">
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      {item.isSoldOut && <span className="px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase">Tükendi</span>}
                      {item.hasVariations && <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold uppercase">Seçenekli</span>}
                      {item.isSeasonalPriceOnRequest && <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 text-[10px] font-bold uppercase">Fiyat Sorunuz</span>}
                    </div>
                  </div>
                  
                  <div className="col-span-1 md:col-span-3 text-sm font-medium text-muted-foreground">
                    {CATEGORY_OPTIONS.find(c => c.id === item.category)?.label || item.category}
                  </div>

                  <div className="col-span-1 md:col-span-2 text-left md:text-right font-bold text-primary">
                    {item.isSeasonalPriceOnRequest ? "-" : item.hasVariations ? "Seçenekli" : `${item.price.toLocaleString("tr-TR")} TL`}
                  </div>

                  <div className="col-span-1 md:col-span-1 text-left md:text-center font-medium">
                    {item.stock !== null && item.stock !== undefined ? (
                       <span className={item.stock <= 5 ? "text-amber-500 font-bold" : "text-foreground"}>{item.stock}</span>
                    ) : (
                       <span className="text-muted-foreground/50">-</span>
                    )}
                  </div>

                  <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                    <Button size="sm" variant="outline" className="h-8" onClick={() => openEditModal(item)}>
                      <Edit2 className="h-3.5 w-3.5 mr-1" /> Düzenle
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ÜRÜN EKLE/DÜZENLE MODALI */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{modalMode === "add" ? "Yeni Ürün Ekle" : "Ürünü Düzenle"}</DialogTitle>
            <DialogDescription>
              Ürün ismini, kategorisini ve fiyatını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                placeholder="örn. Karışık Kebap"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                value={currentItem.category}
                onChange={(e) => setCurrentItem({ ...currentItem, category: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="" disabled>Kategori Seçin</option>
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Varsayılan Fiyat (TL)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="örn. 450"
                  value={currentItem.price}
                  onChange={(e) => setCurrentItem({ ...currentItem, price: e.target.value })}
                  disabled={currentItem.hasVariations || currentItem.isSeasonalPriceOnRequest}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok (Opsiyonel)</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Boş = Takipsiz"
                  value={currentItem.stock}
                  onChange={(e) => setCurrentItem({ ...currentItem, stock: e.target.value })}
                />
              </div>
            </div>

            {/* CHECKBOX AYARLARI */}
            <div className="flex flex-col gap-3 p-3 bg-secondary/30 rounded-lg border border-border mt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input 
                  type="checkbox" 
                  checked={currentItem.isSoldOut}
                  onChange={(e) => setCurrentItem({...currentItem, isSoldOut: e.target.checked})}
                  className="w-4 h-4 rounded border-border"
                />
                Bu ürün tükendi (Satışa Kapat)
              </label>
              
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                <input 
                  type="checkbox" 
                  checked={currentItem.isSeasonalPriceOnRequest}
                  onChange={(e) => {
                    setCurrentItem({...currentItem, isSeasonalPriceOnRequest: e.target.checked, price: e.target.checked ? 0 : currentItem.price});
                  }}
                  className="w-4 h-4 rounded border-border"
                />
                Mevsimlik / Fiyat Sorunuz (Fiyat gizlenir)
              </label>
            </div>

            {/* VARYASYONLAR (SEÇENEKLER) ALANI */}
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-base font-semibold text-primary">Ürün Seçenekleri (Varyasyonlar)</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Bu üründe "Dürüm/Porsiyon" veya "Şişe/Kadeh" gibi farklı fiyatlı alt seçenekler varsa buradan ekleyin.
              </p>
              
              <div className="space-y-2">
                {currentItem.variations.map((v, idx) => (
                  <div key={idx} className="flex gap-2 items-center bg-secondary/20 p-2 rounded-lg border border-border">
                    <Input 
                      placeholder="Örn: 1.5 Porsiyon" 
                      value={v.label} 
                      onChange={(e) => handleVariationChange(idx, 'label', e.target.value)} 
                      className="flex-1 bg-background h-9"
                    />
                    <div className="relative w-28">
                      <Input 
                        type="number" 
                        placeholder="Fiyat" 
                        value={v.price} 
                        onChange={(e) => handleVariationChange(idx, 'price', e.target.value)} 
                        className="bg-background h-9 pr-6 text-right"
                      />
                      <span className="absolute right-2 top-2 text-xs text-muted-foreground font-bold">TL</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveVariation(idx)} className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-500/10">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                
                <Button variant="outline" size="sm" onClick={handleAddVariation} className="w-full mt-2 border-dashed border-2">
                  <Plus className="w-4 h-4 mr-2" /> Yeni Seçenek Ekle
                </Button>
              </div>
            </div>

          </div>
          
          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>İptal</Button>
            <Button onClick={handleSave} className="font-bold px-8">Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}