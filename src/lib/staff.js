const STORAGE_KEY = "app_staff_list";

const DEFAULT_STAFF = [
  { id: "1", name: "Garson Ahmet", role: "waiter" },
  { id: "2", name: "Garson Mehmet", role: "waiter" },
  { id: "3", name: "Garson Ayşe", role: "waiter" },
  { id: "4", name: "Kasiyer Ali", role: "cashier" },
  { id: "5", name: "Mutfak Şefi Mustafa", role: "kitchen" },
  { id: "6", name: "Yönetici", role: "admin" }
];

// Personel listesini getirir (OrderScreen.jsx 'async/Promise' yapısı bekler)
export async function getStaff() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_STAFF));
    return DEFAULT_STAFF;
  }
  return JSON.parse(stored);
}

// Personel listesini günceller/kaydeder
export function saveStaff(staffList) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(staffList));
}

// Yeni personel ekler
export function addStaff(name, role = "waiter") {
  const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  const newPerson = { id: `staff-${Date.now()}`, name, role };
  list.push(newPerson);
  saveStaff(list);
  return newPerson;
}