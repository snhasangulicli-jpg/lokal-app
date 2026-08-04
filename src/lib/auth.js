const STORAGE_KEY = "app_user_session";

// Restoran Personel Rolleri
export const ROLES = {
  ADMIN: "admin",      // Yönetici (Menü yönetimi, fiyatlar, tüm yetkiler)
  WAITER: "waiter",    // Garson (Masa seçimi, sipariş oluşturma)
  CASHIER: "cashier",  // Kasiyer (Adisyon kapatma, ödeme alma, veresiye)
  KITCHEN: "kitchen",  // Mutfak (Mutfak ekranı, sipariş aşamalarını ilerletme)
};

const DEFAULT_USER = {
  name: "Garson Ahmet",
  role: ROLES.WAITER,
};

// Aktif kullanıcı oturumunu getirir
export function getCurrentUser() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_USER));
    return DEFAULT_USER;
  }
  return JSON.parse(stored);
}

// Personel ve rolünü değiştirir
export function setCurrentUser(name, role) {
  const user = { name, role };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return user;
}

// Kolay Rol Kontrol Fonksiyonları
export function isAdmin() {
  return getCurrentUser()?.role === ROLES.ADMIN;
}

export function isGarson() {
  const role = getCurrentUser()?.role;
  return role === ROLES.WAITER || role === ROLES.ADMIN;
}

export function isKasiyer() {
  const role = getCurrentUser()?.role;
  return role === ROLES.CASHIER || role === ROLES.ADMIN;
}

export function isMutfak() {
  const role = getCurrentUser()?.role;
  return role === ROLES.KITCHEN || role === ROLES.ADMIN;
}