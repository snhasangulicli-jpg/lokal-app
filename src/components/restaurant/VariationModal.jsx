import React from 'react';
import { X, Check } from 'lucide-react';

export default function VariationModal({ item, onSelect, onClose, hidePrices }) {
  // ÇÖKMEYİ ÖNLEYEN ZIRH: Eğer item veya variations verisi yoksa modal hiç açılmaz
  if (!item || !item.variations || !Array.isArray(item.variations)) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" 
      onClick={onClose}
    >
      <div
        className="bg-card text-card-foreground rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-border animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-primary/10 px-6 py-4 flex items-center justify-between border-b border-border/50">
          <div>
            <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">Seçenek Belirleyin</p>
            <h2 className="text-foreground font-bold text-xl">{item.name}</h2>
          </div>
          
          <button 
            onClick={onClose} 
            className="p-2 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-2.5 max-h-[60vh] overflow-y-auto scrollbar-thin">
          {item.variations.map((v) => (
            <button
              key={v.label}
              onClick={() => onSelect(v)}
              className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-border/60 hover:border-primary hover:bg-primary/5 transition-all group active:scale-[0.98] shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-base text-foreground text-left">{v.label}</span>
              </div>
              
              {/* SADECE YETKİLİLER FİYAT GÖRÜR */}
              {!hidePrices && (
                <span className="font-extrabold text-primary text-base flex-shrink-0">
                  {(v.price ?? 0).toLocaleString('tr-TR')} TL
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}