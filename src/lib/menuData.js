import Papa from 'papaparse';

const STORAGE_KEY = 'app_menu_items';

// CSV dosyasından veya yerel hafızadan menüyü getirir
export async function getMenuItems() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }

  // LocalStorage boşsa public/menu.csv dosyasını oku
  const response = await fetch('/menu.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        // CSV'den gelen metin formatlı varyasyonları nesneye dönüştür
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
      error: (error) => reject(error)
    });
  });
}

// Menüdeki değişiklikleri kaydeder
export function saveMenuItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// CSV dosyasındaki orijinal verilere geri dönmek için sıfırlama fonksiyonu
export async function resetMenuFromCSV() {
  localStorage.removeItem(STORAGE_KEY);
  return await getMenuItems();
}