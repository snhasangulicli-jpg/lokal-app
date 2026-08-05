import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { getMenuItems, migrateMenuToSupabase } from "@/lib/menuData";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Database, Search, Edit2, Check, X } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AdminScreen() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  
  // Düzenleme sırasında geçici verileri tutacağımız state
  const [editForm, setEditForm] = useState({ price: 0, isSoldOut: false });

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

  // Düzenleme Moduna Geç
  const startEditing = (item) => {
    setEditingId(item.id);
    setEditForm({ price: item.price, isSoldOut: item.isSoldOut });
  };

  // Düzenlemeyi İptal Et
  const cancelEditing = () => {
    setEditingId(null);
  };

  // Düzenlemeyi Kaydet (Supabase'e gönder)
  const saveEditing = async (id) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ 
          price: Number(editForm.price), 
          isSoldOut: editForm.isSoldOut 
        })
        .eq('id', id);

      if (error) throw error;

      toast({ title: "Başarılı", description: "Ürün güncellendi." });
      setEditingId(null);
      loadData(); // Listeyi yenile
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Güncelleme başarısız." });
    }
  };

  // CSV'den Supabase'e Sihirli Aktarım
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

  // Arama Filtresi
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppLayout>
      <div className="flex h-full flex-col p-4 md:p-6 mx-auto max-w-6xl">
        
        {/* Üst Kısım: Başlık ve Aktarım Butonu */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Menü Yönetimi</h1>
            <p className="text-sm text-muted-foreground">Ürün fiyatlarını ve stok durumlarını canlı olarak güncelleyin.</p>
          </div>
          <Button 
            onClick={handleMigrate} 
            disabled={migrating}
            variant="outline"
            className="w-full md:w-auto bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/30"
          >
            {migrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
            {migrating ? "Aktarılıyor..." : "CSV'den Veritabanına Aktar"}
          </Button>
        </div>

        {/* Arama Kutusu */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Ürün adı veya kategori ara..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-12 bg-background/50"
          />
        </div>

        {/* Ürün Listesi Tablosu */}
        <div className="bg-card border border-border rounded-xl overflow-hidden flex-1 flex flex-col">
          <div className="hidden md:grid grid-cols-12 gap-2 p-4 border-b border-border bg-muted/30 font-semibold text-sm text-muted-foreground">
            <div className="col-span-4">Ürün Adı</div>
            <div className="col-span-3">Kategori</div>
            <div className="col-span-2 text-right">Fiyat (TL)</div>
            <div className="col-span-2 text-center">Durum</div>
            <div className="col-span-1 text-right">İşlem</div>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {loading ? (
               <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : filteredItems.length === 0 ? (
               <div className="text-center py-10 text-muted-foreground">Ürün bulunamadı. Aktarım yapmayı denediniz mi?</div>
            ) : (
              filteredItems.map(item => (
                <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 p-3 border-b border-border items-center hover:bg-muted/10 transition-colors">
                  
                  {/* İsim ve Kategori (Mobilde alt alta) */}
                  <div className="col-span-1 md:col-span-4 font-medium">{item.name}</div>
                  <div className="col-span-1 md:col-span-3 text-sm text-muted-foreground">{item.category}</div>

                  {/* Düzenleme Modu */}
                  {editingId === item.id ? (
                    <>
                      <div className="col-span-1 md:col-span-2">
                        <Input 
                          type="number" 
                          value={editForm.price} 
                          onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                          className="h-9 text-right"
                        />
                      </div>
                      <div className="col-span-1 md:col-span-2 flex justify-center items-center">
                        <label className="flex items-center gap-2 cursor-pointer text-sm">
                          <input 
                            type="checkbox" 
                            checked={editForm.isSoldOut}
                            onChange={(e) => setEditForm({...editForm, isSoldOut: e.target.checked})}
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className={editForm.isSoldOut ? "text-red-500 font-bold" : "text-muted-foreground"}>
                            {editForm.isSoldOut ? "Tükendi" : "Mevcut"}
                          </span>
                        </label>
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-green-500 hover:text-green-600" onClick={() => saveEditing(item.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={cancelEditing}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  ) : (
                    // Görüntüleme Modu
                    <>
                      <div className="col-span-1 md:col-span-2 text-left md:text-right font-bold text-primary">
                        {item.price.toLocaleString("tr-TR")} TL
                      </div>
                      <div className="col-span-1 md:col-span-2 text-left md:text-center">
                        {item.isSoldOut ? (
                           <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold uppercase tracking-wider">Tükendi</span>
                        ) : (
                           <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-semibold uppercase tracking-wider">Mevcut</span>
                        )}
                      </div>
                      <div className="col-span-1 md:col-span-1 flex justify-end">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => startEditing(item)}>
                          <Edit2 className="h-4 w-4" />
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
    </AppLayout>
  );
}