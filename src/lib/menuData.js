import Papa from 'papaparse';
import { supabase } from "@/lib/supabase";

// 1. ANA FONKSİYON: Menüyü Getir (Önce Supabase, Boşsa CSV)
export async function getMenuItems() {
  try {
    // Önce Supabase'den çekmeyi deniyoruz
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;

    // Eğer Supabase'de veri varsa, CANLI VERİYİ döndür
    if (data && data.length > 0) {
      return data;
    }

    // EĞER SUPABASE BOŞSA (Henüz aktarım yapılmadıysa) geçici olarak CSV'yi kullan
    console.log("Supabase boş, CSV yedeği yükleniyor...");
    return await fetchFallbackCSV();
  } catch (error) {
    console.error("Menü çekilirken hata:", error);
    return await fetchFallbackCSV(); // Hata anında da hayat kurtarıcı CSV'ye dön
  }
}

// 2. YEDEK FONKSİYON: Eski CSV okuma mantığı
export async function fetchFallbackCSV() {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/menu.csv`);
    if (!response.ok) return [];
    
    const csvText = await response.text();

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const formattedData = results.data.map((item) => {
            let parsedVariations = [];
            if (typeof item.variations === 'string') {
              try { parsedVariations = JSON.parse(item.variations); } catch (e) {}
            } else if (Array.isArray(item.variations)) {
              parsedVariations = item.variations;
            }

            return {
              id: String(item.id || `item-${Math.random().toString(36).substr(2, 9)}`),
              name: item.name || "İsimsiz Ürün",
              category: item.category || "Diğer",
              price: Number(item.price) || 0,
              hasVariations: Boolean(item.hasVariations),
              isSeasonalPriceOnRequest: Boolean(item.isSeasonalPriceOnRequest),
              variations: parsedVariations,
              isSoldOut: false
            };
          });
          resolve(formattedData);
        },
        error: () => resolve([])
      });
    });
  } catch (e) {
    return [];
  }
}

// 3. SİHİRLİ FONKSİYON: CSV'deki verileri Supabase'e kalıcı olarak taşır
export async function migrateMenuToSupabase() {
  try {
    const csvData = await fetchFallbackCSV();
    if (!csvData || csvData.length === 0) throw new Error("CSV dosyası boş veya bulunamadı.");

    // Verileri Supabase tablosuyla tam uyumlu hale getir
    const itemsToInsert = csvData.map(item => ({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      "hasVariations": item.hasVariations,
      "isSeasonalPriceOnRequest": item.isSeasonalPriceOnRequest,
      "isSoldOut": item.isSoldOut || false,
      variations: item.variations
    }));

    // Hepsini tek seferde Supabase'e gönder (varsa üzerine yazar)
    const { error } = await supabase.from('menu_items').upsert(itemsToInsert);
    if (error) throw error;
    
    return { success: true, count: itemsToInsert.length };
  } catch (error) {
    console.error("Aktarım hatası:", error);
    return { success: false, error: error.message };
  }
}