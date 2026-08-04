export const CATEGORIES = [
  { id: "Fix Menü", label: "Fix Menü", short: "Fix Menü" },
  { id: "A la Carte - Balık", label: "A la Carte - Balık", short: "Balık" },
  { id: "A la Carte - Et-Tavuk", label: "A la Carte - Et-Tavuk", short: "Et-Tavuk" },
  { id: "Ekstralar", label: "Ekstralar", short: "Ekstralar" },
  { id: "Başlangıç", label: "Başlangıç", short: "Başlangıç" },
  { id: "Mezeler", label: "Mezeler", short: "Mezeler" },
  { id: "Tatlı & Meyve & Mevsimlikler", label: "Tatlı & Meyve & Mevsimlikler", short: "Tatlı & Meyve" },
  { id: "Meşrubatlar & Sıcak İçecekler", label: "Meşrubatlar & Sıcak İçecekler", short: "Meşrubatlar" },
  { id: "Rakı", label: "Rakı", short: "Rakı" },
  { id: "Viskiler", label: "Viskiler", short: "Viskiler" },
  { id: "Biralar & Diğer Alkollü İçecekler", label: "Biralar & Diğer Alkollü İçecekler", short: "Biralar" },
  { id: "Şaraplar", label: "Şaraplar", short: "Şaraplar" },
];

export const CATEGORY_LABEL = CATEGORIES.reduce((acc, c) => {
  acc[c.id] = c.label;
  return acc;
}, {});

export const KITCHEN_STAGES = [
  { stage: 0, label: "Yeni Sipariş", emoji: "📥" },
  { stage: 1, label: "Soğuk Meze", emoji: "🥗" },
  { stage: 2, label: "Ekmek & Zeytin", emoji: "🍞" },
  { stage: 3, label: "Salata", emoji: "🥬" },
  { stage: 4, label: "Sıcak Başlangıçlar", emoji: "🔥" },
  { stage: 5, label: "Patates Kızartması", emoji: "🍟" },
  { stage: 6, label: "Ana Yemek", emoji: "🍽️" },
  { stage: 7, label: "Tatlı / Meyve", emoji: "🍰" },
  { stage: 8, label: "Tamamlandı", emoji: "✅" },
];

export const MENU_TYPE_LABELS = {
  fixed_fish: "Balık Fix",
  fixed_meze: "Meze Fix",
  kebab_set: "Kebap Set",
  lamb_set: "Pirzola Set",
  meat_set: "Et Fix",
  chicken_set: "Tavuk Fix",
  individual: "Tek",
};

export const MENU_TYPE_BADGE = {
  fixed_fish: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  fixed_meze: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  kebab_set: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  lamb_set: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  meat_set: "bg-red-500/15 text-red-600 dark:text-red-400",
  chicken_set: "bg-teal-500/15 text-teal-600 dark:text-teal-400",
  individual: "bg-gray-500/15 text-gray-600 dark:text-gray-400",
};

export function detectMenuType(cartItems) {
  const fixMenu = (cartItems || []).find((c) => c.name && c.name.includes("Fix Menü"));
  if (!fixMenu) return "individual";
  const n = fixMenu.name.toLowerCase();
  if (n.includes("kebab")) return "kebab_set";
  if (n.includes("pirzola")) return "lamb_set";
  if (n.includes("et")) return "meat_set";
  if (n.includes("tavuk")) return "chicken_set";
  if (n.includes("meze")) return "fixed_meze";
  return "fixed_fish";
}

export const STUCK_THRESHOLD_MIN = 15;

export function getStageStartMs(order) {
  const stage = order.currentStage ?? 0;
  const ts = order.stageTimestamps?.[stage];
  if (ts) return new Date(ts).getTime();
  if (order.created_date) return new Date(order.created_date).getTime();
  return Date.now();
}

export function isOrderStuck(order, thresholdMin = STUCK_THRESHOLD_MIN) {
  return Date.now() - getStageStartMs(order) > thresholdMin * 60 * 1000;
}

export function isItemSoldOut(item) {
  return !!item && item.stock != null && item.stock <= 0;
}

export function buildSoldOutNames(menuItems) {
  const set = new Set();
  (menuItems || []).forEach((m) => {
    if (isItemSoldOut(m)) set.add(m.name);
  });
  return set;
}

// Set menüler için zorunlu aşamalar (1-7). Aşama 0 = yeni, 8 = tamamlandı.
export const REQUIRED_STAGES = [1, 2, 3, 4, 5, 6, 7];

export function getCheckedStages(order) {
  const ts = order?.stageTimestamps || {};
  return new Set(
    Object.keys(ts)
      .filter((k) => k !== "0" && k !== "8" && ts[k])
      .map((k) => Number(k))
      .filter((n) => REQUIRED_STAGES.includes(n))
  );
}

export function isOrderCompleted(order) {
  if (order?.status === "completed") return true;
  if (order?.menuType && order.menuType !== "individual") {
    return REQUIRED_STAGES.every((s) => getCheckedStages(order).has(s));
  }
  return false;
}