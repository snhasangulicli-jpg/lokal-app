import React from 'react';
import { X, Plus, Minus, Trash2, Send, MapPin, ShoppingCart } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

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
  hidePrices // <--- Fiyatları gizleme komutu
}) {
  const safeCart = cart || [];
  const canSend = safeCart.length > 0 && String(tableNumber || "").trim();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        className="bg-card text-card-foreground w-full max-w-md h-full flex flex-col shadow-2xl border-l border-border animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between border-b border-border/50">
          <div>
            <h2 className="text-foreground font-bold text-xl">Sepet Özeti</h2>
            <p className="text-muted-foreground text-xs font-semibold">{safeCart.length} farklı ürün</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Masa Numarası Seçimi (Sabit 8 Masa Butonu + Manuel Giriş) */}
        <div className="px-6 py-4 border-b border-border/60 bg-secondary/20 space-y-3">
          <Label className="flex items-center gap-2 text-foreground font-bold text-xs uppercase tracking-wider">
            <MapPin className="w-4 h-4 text-primary" />
            Masa Seçimi (Zorunlu)
          </Label>
          
          {/* Sabit 8 Masa Butonu */}
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <Button
                key={num}
                type="button"
                variant={String(tableNumber) === String(num) ? "default" : "outline"}
                onClick={() => setTableNumber && setTableNumber(String(num))}
                className={`h-11 rounded-xl text-base font-bold transition-all ${
                  String(tableNumber) === String(num)
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary"
                    : "bg-background hover:bg-secondary border-border"
                }`}
              >
                M{num}
              </Button>
            ))}
          </div>

          <Input
            type="text"
            value={tableNumber || ""}
            onChange={(e) => setTableNumber && setTableNumber(e.target.value)}
            placeholder="Veya diğer masa (Örn: 14, Bahçe 2)"
            className="w-full bg-background border-border rounded-xl px-4 py-2.5 font-bold text-sm h-11"
          />
        </div>

        {/* Sepet Ürünleri Listesi */}
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-thin space-y-3">
          {safeCart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-3 shadow-sm">
                <ShoppingCart className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="font-bold text-base text-foreground">Sepet boş</p>
              <p className="text-xs text-muted-foreground mt-0.5">Menüden ürün ekleyin</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {safeCart.map((item) => (
                <div key={item.key} className="flex items-center gap-3 bg-background border border-border/60 shadow-sm rounded-2xl p-3.5">
                  <div className="flex-1">
                    <p className="font-bold text-foreground text-sm leading-tight">{item.name}</p>
                    {item.variationLabel && (
                      <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0">
                        {item.variationLabel}
                      </Badge>
                    )}
                    
                    {!hidePrices && (
                      <p className="text-primary font-bold text-xs mt-1">
                        {((item.unitPrice ?? 0) * (item.quantity ?? 1)).toLocaleString('tr-TR')} TL
                      </p>
                    )}
                  </div>
                  
                  {/* Miktar Artırma / Azaltma Butonları */}
                  <div className="flex items-center gap-1 bg-secondary/60 rounded-xl border border-border/50 p-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onQty && onQty(item.key, -1)}
                      className="w-7 h-7 rounded-lg hover:bg-background"
                    >
                      <Minus className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                    <span className="font-bold text-foreground w-6 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onQty && onQty(item.key, 1)}
                      className="w-7 h-7 rounded-lg hover:bg-background bg-primary/10 text-primary"
                    >
                      <Plus className="w-3.5 h-3.5 text-primary" />
                    </Button>
                  </div>
                  
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onRemove && onRemove(item.key)}
                    className="h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl ml-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              
              <Button
                variant="ghost"
                onClick={onClear}
                className="w-full text-center text-xs text-muted-foreground hover:text-destructive font-semibold py-2 transition-colors mt-2"
              >
                Tümünü Temizle
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
          {!hidePrices && (
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-muted-foreground font-semibold text-sm">Toplam Tutar</span>
              <span className="text-2xl font-black text-primary">{(total ?? 0).toLocaleString('tr-TR')} TL</span>
            </div>
          )}
          
          <Button
            onClick={onSend}
            disabled={!canSend || sending}
            size="lg"
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-secondary disabled:text-muted-foreground text-white font-bold h-14 rounded-2xl transition-all text-base shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
          >
            <Send className="w-5 h-5" />
            {sending ? 'Gönderiliyor...' : 'Mutfağa Gönder'}
          </Button>
          
          {!canSend && safeCart.length > 0 && (
            <p className="text-center text-xs text-amber-500 mt-2 font-bold animate-pulse">Lütfen masa seçin veya yazın</p>
          )}
        </div>
      </div>
    </div>
  );
}