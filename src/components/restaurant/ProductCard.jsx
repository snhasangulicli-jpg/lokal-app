import React from 'react';
import { Plus, HelpCircle } from 'lucide-react';

export default function ProductCard({ item, onAdd, hidePrices }) {
  // Eğer fiyatlar gizliyse, sadece "Seçenekli" veya "Fiyat Sorunuz" gibi özel durumları göster
  const priceLabel = hidePrices
    ? (item.isSeasonalPriceOnRequest ? 'Fiyat Sorunuz' : item.hasVariations ? 'Seçenekli' : 'Ekle')
    : item.isSeasonalPriceOnRequest
      ? 'Fiyat Sorunuz'
      : item.hasVariations && (!item.price || item.price === 0)
        ? 'Seçenekli'
        : `${(item.price ?? 0).toLocaleString('tr-TR')} TL`; // ÇÖKMEYİ ÖNLEYEN ZIRH (?? 0)

  return (
    <button
      onClick={() => onAdd(item)}
      className="group bg-card rounded-2xl border border-border hover:border-primary hover:shadow-md transition-all p-4 text-left flex flex-col justify-between min-h-[120px] relative overflow-hidden active:scale-[0.98]"
    >
      {item.isSeasonalPriceOnRequest && (
        <div className="absolute top-2 right-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
        </div>
      )}
      
      <div>
        <h3 className="font-bold text-card-foreground text-sm leading-snug mb-1">{item.name}</h3>
        
        {item.description && !item.isSeasonalPriceOnRequest && (
          <p className="text-xs text-muted-foreground">{item.description}</p>
        )}
        
        {item.unitLabel && (
          <span className="inline-block text-xs text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-md mt-1">
            {item.unitLabel}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mt-3">
        <span className={`font-extrabold ${item.isSeasonalPriceOnRequest ? 'text-amber-500 text-xs' : (hidePrices && !item.hasVariations ? 'text-muted-foreground text-sm' : 'text-primary text-base')}`}>
          {priceLabel}
        </span>
        
        <div className="w-8 h-8 rounded-xl bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground text-primary flex items-center justify-center transition-colors flex-shrink-0 shadow-sm">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}