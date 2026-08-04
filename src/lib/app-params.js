// Base44 bağımlılıkları temizlenmiş standart yapı
const isNode = typeof window === "undefined";
const storage = !isNode ? window.localStorage : new Map();

export const appParams = {
  appId: import.meta.env.VITE_APP_ID || "default_app",
  token: !isNode ? storage.getItem("token") : null,
  appBaseUrl: import.meta.env.VITE_API_BASE_URL || "",
};