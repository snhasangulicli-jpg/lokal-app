import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMenuItems, migrateMenuToSupabase } from "@/lib/menuData";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Database, Search, Edit2, Check, X, Plus, Trash2 } from "lucide-react";
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

export default function AdminScreen() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  // Düzenleme ve Ekleme State'leri (Stok alanı eklendi)
  const [editForm, setEditForm] = useState({ price: 0, isSoldOut: false, stock: "" });
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", price: "", stock: "" });

  // Menüyü Yükle
  const loadData = async () => {
    setLoading(true);
    const data = await getMenuItems();
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- ÜRÜN DÜZENLEME ---
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({ 
      price: item.price, 
      isSoldOut: item.isSoldOut,
      stock: item.stock !== null && item.stock !== undefined ? item.stock : "" 
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const saveEditing = async (id) => {
    try {
      // Stok boş bırakıldıysa null (takip edilmiyor), doluysa sayıya çevir
      const parsedStock = editForm.stock === "" ? null : parseInt(editForm.stock, 10);

      const { error } = await supabase
        .from('menu_items')
        .update({ 
          price: Number(editForm.price), 
          isSoldOut: editForm.isSoldOut,
          stock: parsedStock
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Başarılı", description: "Ürün güncellendi." });
      setEditingId(null);
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Güncelleme başarısız." });
    }
  };

  // --- YENİ ÜRÜN EKLEME ---
  const handleAdd = async () => {
    if (!newItem.name.trim() || !newItem.category.trim()) {
      return toast({ variant: "destructive", title: "Eksik Bilgi", description: "Lütfen ürün adı ve kategorisini girin." });
    }
    
    try {
      const parsedStock = newItem.stock === "" ? null : parseInt(newItem.stock, 10);
      const newId = `item-${Math.random().toString(36).substr(2, 9)}`;
      
      const { error } = await supabase.from('menu_items').insert([{
        id: newId,
        name: newItem.name.trim(),
        category: newItem.category.trim(),
        price: Number(newItem.price) || 0,
        isSoldOut: false,
        hasVariations: false,
        isSeasonalPriceOnRequest: false,
        stock: parsedStock
      }]);

      if (error) throw error;

      toast({ title: "Başarılı", description: "Yeni ürün menüye eklendi." });
      setIsAddOpen(false);
      setNewItem({ name: "", category: "", price: "", stock: "" });
      loadData();
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Ürün eklenemedi." });
    }
  };

  // --- ÜRÜN SİLME ---
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

  // --- MIGRATION (CSV'DEN AKTARIM) ---
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
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex h-full flex-col p-4 md:p-6 mx-auto max-w-6xl">
        
        {/* Üst Kısım */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Menü Yönetimi</h1>
            <p className="text-sm text-muted-foreground">Ürün fiyatlarını ve stok durumlarını canlı olarak güncelleyin.</p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
            <Button onClick={() => setIsAddOpen(true)} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Yeni Ürün
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
            className="pl-9 h-12 bg-background/50"
          />
        </div>

        {/* Liste */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="hidden md:grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/30 font-semibold text-sm text-muted-foreground">
            <div className="col-span-3">Ürün Adı</div>
            <div className="col-span-3">Kategori</div>
            <div className="col-span-2 text-right">Fiyat (TL)</div>
            <div className="col-span-1 text-center">Stok</div>
            <div className="col-span-1 text-center">Durum</div>
            <div className="col-span-2 text-right">İşlem</div>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
               <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredItems.length === 0 ? (
               <div className="text-center py-10 text-muted-foreground">Ürün bulunamadı. Aktarım yapmayı denediniz mi?</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 border-b border-border items-center hover:bg-muted/10 transition-colors">
                  
                  <div className="col-span-1 md:col-span-3 font-medium">{item.name}</div>
                  <div className="col-span-1 md:col-span-3 text-sm text-muted-foreground">{item.category}</div>

                  {editingId === item.id ? (
                    <>
                      <div className="col-span-1 md:col-span-2 flex justify-end">
                        <Input 
                          type="number" 
                          value={editForm.price} 
                          onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                          className="h-9 text-right w-24"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-center">
                        <Input 
                          type="number" 
                          placeholder="-" 
                          value={editForm.stock} 
                          onChange={(e) => setEditForm({...editForm, stock: e.target.value})}
                          className="h-9 text-center w-16"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-center items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            checked={editForm.isSoldOut}
                            onChange={(e) => setEditForm({...editForm, isSoldOut: e.target.checked})}
                            className="w-4 h-4 rounded border-border"
                          />
                        </label>
                      </div>
                      <div className="col-span-1 md:col-span-2 flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => saveEditing(item.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="col-span-1 md:col-span-2 text-left md:text-right font-bold text-primary">
                        {item.price.toLocaleString("tr-TR")} TL
                      </div>
                      <div className="col-span-1 md:col-span-1 text-left md:text-center font-medium">
                        {item.stock !== null && item.stock !== undefined ? (
                           <span className={item.stock <= 5 ? "text-amber-500" : "text-foreground"}>{item.stock}</span>
                        ) : (
                           <span className="text-muted-foreground/50">-</span>
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-1 text-left md:text-center">
                        {item.isSoldOut ? (
                           <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">Tükendi</span>
                        ) : (
                           <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[10px] font-semibold uppercase tracking-wider">Mevcut</span>
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-2 flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => startEditing(item)}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id, item.name)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Yeni Ürün Modali */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border">
          <DialogHeader>
            <DialogTitle>Yeni Ürün Ekle</DialogTitle>
            <DialogDescription>
              Menüye eklenecek ürünün detaylarını girin.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Ürün Adı *</Label>
              <Input
                id="name"
                placeholder="örn. Karışık Kebap"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                placeholder="örn. Ana Yemekler"
                value={newItem.category}
                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Fiyat (TL)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="örn. 450"
                  value={newItem.price}
                  onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stok (Opsiyonel)</Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Boş = Takipsiz"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                />
              </div>
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full font-semibold">
            Ürünü Kaydet
          </Button>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}