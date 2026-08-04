import Papa from 'papaparse';

const STORAGE_KEY = 'app_menu_items';

export async function getMenuItems() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.length > 0) return parsed;
    } catch(e) {} // Hata olursa dosyayı baştan okusun
  }

  try {
    // Vercel'in public klasörüne kesin erişim için origin kullanıyoruz
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/menu.csv`);
    
    if (!response.ok) {
      throw new Error(`CSV yüklenemedi: ${response.status}`);
    }
    
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          const formattedData = results.data.map((item) => {
            let parsedVariations = [];
            if (item.variations && typeof item.variations === 'string') {
              try {
                parsedVariations = JSON.parse(item.variations);
              } catch (e) {
                parsedVariations = [];
              }
            } else if (Array.isArray(item.variations)) {
              parsedVariations = item.variations;
            }

            return {
              ...item,
              id: String(item.id || `item-${Math.random().toString(36).substr(2, 9)}`),
              price: Number(item.price) || 0,
              hasVariations: Boolean(item.hasVariations),
              isSeasonalPriceOnRequest: Boolean(item.isSeasonalPriceOnRequest),
              variations: parsedVariations,
              stock: item.stock ?? null
            };
          });

          localStorage.setItem(STORAGE_KEY, JSON.stringify(formattedData));
          resolve(formattedData);
        },
        error: (error) => {
          console.error("CSV ayrıştırma hatası:", error);
          resolve([]); // Çökmeyi engeller
        }
      });
    });
  } catch (error) {
    console.error("Menü çekilirken kritik hata:", error);
    return []; // Hata anında boş liste döner, beyaz ekranı engeller
  }
}

export function saveMenuItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function resetMenuFromCSV() {
  localStorage.removeItem(STORAGE_KEY);
  return await getMenuItems();
}