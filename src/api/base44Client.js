// src/api/base44Client.js
// Base44 bağımlılığı tamamen kaldırıldı. 
// Tüm dosyalar taşınana kadar uygulamanın hata vermemesi için sahte (mock) bir iskelet oluşturuldu.

export const base44 = {
  auth: {
    loginViaEmailPassword: async (email, password) => {
      console.log("Giriş yapıldı:", email);
      return { user: { email } };
    },
    logout: async () => {
      console.log("Çıkış yapıldı");
    }
  },
  entities: {
    Order: {
      create: async (data) => {
        console.log("Yeni sipariş oluşturuldu:", data);
        return { id: Math.random().toString(36).substr(2, 9), ...data };
      },
      update: async (id, updates) => {
        console.log("Sipariş güncellendi:", id, updates);
      },
      filter: async () => {
        return []; // Şimdilik boş liste döner
      },
      subscribe: (callback) => {
        // Canlı dinleme simülasyonu
        return () => console.log("Abonelik iptal edildi"); 
      }
    }
  }
};