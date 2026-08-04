const KEY = "staff_session";

export function getStaff() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStaff(name, role) {
  const staff = { name: String(name || "").trim(), role };
  localStorage.setItem(KEY, JSON.stringify(staff));
  return staff;
}

export function clearStaff() {
  localStorage.removeItem(KEY);
}

export const ROLE_HOME = {
  Garson: "/order",
  Mutfak: "/",
  Kasiyer: "/cashier",
};