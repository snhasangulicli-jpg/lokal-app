import React from 'react';
import { X, Plus, Minus, Trash2, Send, MapPin } from 'lucide-react';

export default function CartPanel({
  cart,
  tableNumber,
  setTableNumber,
  total,
  onQty,
  onRemove,
  onClear,
  onSend,
  sending,
  onClose,
  hidePrices // <--- Fiyatları gizleme komutu eklendi
}) {
  const canSend = cart.length > 0 && tableNumber.trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-white font-bold text-lg">Sepet</h2>
            <p className="text-slate-400 text-xs">{cart.length} farklı ürün</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Table number input */}
        <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
          <label className="flex items-center gap-2 text-slate-600 font-semibold text-sm mb-2">
            <MapPin className="w-4 h-4 text-ocean" />
            Masa Numarası (Zorunlu)
          </label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            placeholder="Örn: 5"
            className="w-full border-2 border-slate-200 focus:border-ocean rounded-xl px-4 py-3 font-bold text-lg focus:outline-none bg-white"
          />
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Plus className="w-8 h-8 text-slate-300" />
              </div>
              <p className="font-semibold">Sepet boş</p>
              <p className="text-sm">Menüden ürün ekleyin</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div key={item.key} className="flex items-center gap-3 bg-white border border-slate-100 shadow-sm rounded-xl p-3">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm leading-tight">{item.name}</p>
                    {item.variationLabel && (
                      <p className="text-xs text-slate-500 mt-0.5">{item.variationLabel}</p>
                    )}
                    
                    {/* FİYAT GÖSTERİMİ */}
                    {!hidePrices && (
                      <p className="text-ocean font-bold text-sm mt-1">
                        {(item.unitPrice * item.quantity).toLocaleString('tr-TR')} TL
                      </p>
                    )}
                  </div>
                  
                  {/* Butonlar */}
                  <div className="flex items-center gap-1.5 bg-slate-50 rounded-lg border border-slate-200 p-1">
                    <button
                      onClick={() => onQty(item.key, -1)}
                      className="w-7 h-7 rounded-md bg-white hover:bg-slate-200 flex items-center justify-center transition-colors shadow-sm"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="font-bold text-slate-800 w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onQty(item.key, 1)}
                      className="w-7 h-7 rounded-md bg-ocean/10 hover:bg-ocean/20 flex items-center justify-center transition-colors"
                    >
                      <Plus className="w-4 h-4 text-ocean" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => onRemove(item.key)}
                    className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              <button
                onClick={onClear}
                className="w-full text-center text-sm text-slate-400 hover:text-red-500 font-medium py-3 transition-colors mt-2"
              >
                Tümünü Sil
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 bg-white shadow-[0_-4px_10px_-4px_rgba(0,0,0,0.05)]">
          {/* FİYAT GİZLİ DEĞİLSE TOPLAMI GÖSTER */}
          {!hidePrices && (
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-600 font-semibold">Toplam</span>
              <span className="text-2xl font-extrabold text-ocean">{total.toLocaleString('tr-TR')} TL</span>
            </div>
          )}
          
          <button
            onClick={onSend}
            disabled={!canSend || sending}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold py-4 rounded-xl transition-all text-lg"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Gönderiliyor...' : 'Mutfağa Gönder'}
          </button>
          
          {!canSend && cart.length > 0 && (
            <p className="text-center text-xs text-amber-600 mt-2 font-medium">Lütfen masa numarası girin</p>
          )}
        </div>
      </div>
    </div>
  );
}