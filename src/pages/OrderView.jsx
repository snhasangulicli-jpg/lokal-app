import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, UtensilsCrossed, ShoppingCart } from 'lucide-react';
import { useAuth } from "@/lib/AuthContext"; // YETKİ KONTROLÜ İÇİN EKLENDİ
import ProductCard from '@/components/restaurant/ProductCard';
import VariationModal from '@/components/restaurant/VariationModal';
import CartPanel from '@/components/restaurant/CartPanel';

const CATEGORIES = [
  { id: 'fix-menu', label: 'Fix Menü' },
  { id: 'balik', label: 'Balık' },
  { id: 'et-tavuk', label: 'Et-Tavuk' },
  { id: 'ekstralar', label: 'Ekstralar' },
  { id: 'baslangic', label: 'Başlangıç' },
  { id: 'mezeler', label: 'Mezeler' },
  { id: 'tatli', label: 'Tatlı & Meyve' },
  { id: 'mesrubat', label: 'İçecekler' },
  { id: 'raki', label: 'Rakı' },
  { id: 'viskiler', label: 'Viskiler' },
  { id: 'biralar', label: 'Biralar' },
  { id: 'saraplar', label: 'Şaraplar' },
];

export default function OrderView() {
  const { user } = useAuth(); // Kullanıcı bilgilerini aldık
  const hidePrices = user?.role === 'garson'; // GARSONSA FİYATLARI GİZLE!

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [cart, setCart] = useState([]); // {key, name, variationLabel, quantity, unitPrice, menuItemId}
  const [tableNumber, setTableNumber] = useState('');
  const [variationItem, setVariationItem] = useState(null);
  const [showCart, setShowCart] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const localMenu = localStorage.getItem('app_menu');
      if (localMenu) {
        setMenuItems(JSON.parse(localMenu));
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Menü yüklenirken hata oluştu:', error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredItems = useMemo(
    () => menuItems.filter((i) => i.category === activeCategory),
    [menuItems, activeCategory]
  );

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cart]
  );
  const cartCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const handleAddProduct = (item) => {
    if (item.hasVariations && item.variations && item.variations.length > 0) {
      setVariationItem(item);
      return;
    }
    addToCart({
      menuItemId: item.id,
      name: item.name,
      variationLabel: item.unitLabel || (item.description ? item.description : ''),
      quantity: 1,
      unitPrice: item.price,
    });
  };

  const addToCart = (entry) => {
    const key = `${entry.menuItemId}__${entry.variationLabel || ''}`;
    setCart((prev) => {
      const existing = prev.find((c) => c.key === key);
      if (existing) {
        return prev.map((c) => (c.key === key ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { key, ...entry }];
    });
  };

  const handleVariationSelect = (item, variation) => {
    addToCart({
      menuItemId: item.id,
      name: item.name,
      variationLabel: variation.label,
      quantity: 1,
      unitPrice: variation.price,
    });
    setVariationItem(null);
  };

  const updateQty = (key, delta) => {
    setCart((prev) =>
      prev
        .map((c) => (c.key === key ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  };

  const removeItem = (key) => {
    setCart((prev) => prev.filter((c) => c.key !== key));
  };

  const clearCart = () => setCart([]);

  const handleSendToKitchen = async () => {
    if (cart.length === 0 || !tableNumber) return;
    setSending(true);
    try {
      const items = cart.map((c) => ({
        name: c.name,
        variationLabel: c.variationLabel || '',
        quantity: c.quantity,
        unitPrice: c.unitPrice,
        totalPrice: c.unitPrice * c.quantity,
      }));

      const newOrder = {
        id: Date.now().toString(),
        tableNumber,
        items,
        totalAmount: cartTotal,
        status: 'pending',
        created_date: new Date().toISOString(),
      };

      const existingOrders = JSON.parse(localStorage.getItem('app_orders') || '[]');
      localStorage.setItem('app_orders', JSON.stringify([newOrder, ...existingOrders]));

      setCart([]);
      setShowCart(false);
      setTableNumber('');
    } catch (error) {
      console.error('Sipariş mutfağa gönderilirken hata oluştu:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-navy text-white sticky top-0 z-20 shadow-lg">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/" className="p-2 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-accent" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">Sipariş Ekranı</h1>
              <p className="text-slate-400 text-xs">{user?.name || "Garson Görünümü"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              placeholder="Masa No"
              className="w-24 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white placeholder-slate-400 font-bold text-center focus:outline-none focus:border-ocean"
            />
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 bg-ocean hover:bg-ocean/90 px-4 py-2.5 rounded-xl font-bold transition-colors"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="hidden sm:inline">Sepet</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category tabs */}
        <div className="border-t border-white/10">
          <div className="flex gap-1 overflow-x-auto px-2 py-2 scrollbar-thin">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-ocean text-white'
                    : 'bg-white/5 text-slate-300 hover:bg-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Products grid */}
      <main className="flex-1 px-4 py-5 pb-32">
        <h2 className="text-slate-700 font-bold text-lg mb-3">
          {CATEGORIES.find((c) => c.id === activeCategory)?.label}
        </h2>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-ocean rounded-full animate-spin mb-4" />
            <p>Menü yükleniyor...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <ProductCard 
                key={item.id} 
                item={item} 
                onAdd={handleAddProduct} 
                hidePrices={hidePrices} // ÜRÜN KARTINA BİLGİ GÖNDERİLDİ
              />
            ))}
          </div>
        )}
      </main>

      {/* Sticky cart summary bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-navy border-t border-white/10 px-4 py-3 z-20 shadow-2xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ocean/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-ocean" />
              </div>
              <div>
                <p className="text-slate-400 text-xs">{cartCount} ürün · Masa {tableNumber || '—'}</p>
                {/* GARSON DEĞİLSE TOPLAMI GÖSTER, GARSONSA GİZLE */}
                {!hidePrices && (
                  <p className="text-white font-extrabold text-lg leading-tight">{cartTotal.toLocaleString('tr-TR')} TL</p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowCart(true)}
              className="bg-ocean hover:bg-ocean/90 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2"
            >
              Sepeti Aç
            </button>
          </div>
        </div>
      )}

      {/* Variation modal */}
      {variationItem && (
        <VariationModal
          item={variationItem}
          onSelect={(v) => handleVariationSelect(variationItem, v)}
          onClose={() => setVariationItem(null)}
          hidePrices={hidePrices} // SEÇENEKLİ ÜRÜNLERE BİLGİ GÖNDERİLDİ
        />
      )}

      {/* Cart panel */}
      {showCart && (
        <CartPanel
          cart={cart}
          tableNumber={tableNumber}
          setTableNumber={setTableNumber}
          total={cartTotal}
          onQty={updateQty}
          onRemove={removeItem}
          onClear={clearCart}
          onSend={handleSendToKitchen}
          sending={sending}
          onClose={() => setShowCart(false)}
          hidePrices={hidePrices} // SEPETE BİLGİ GÖNDERİLDİ
        />
      )}
    </div>
  );
}