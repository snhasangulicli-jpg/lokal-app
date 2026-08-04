import React from 'react';
import { Plus, HelpCircle } from 'lucide-react';

export default function ProductCard({ item, onAdd }) {
  const priceLabel = item.isSeasonalPriceOnRequest
    ? 'Fiyat Sorunuz'
    : item.hasVariations && (!item.price || item.price === 0)
      ? 'Seçenekli'
      : `${item.price.toLocaleString('tr-TR')} TL`;

  return (
    <button
      onClick={() => onAdd(item)}
      className="group bg-white rounded-2xl border border-slate-200 hover:border-ocean hover:shadow-md transition-all p-4 text-left flex flex-col justify-between min-h-[120px] relative overflow-hidden"
    >
      {item.isSeasonalPriceOnRequest && (
        <div className="absolute top-2 right-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
        </div>
      )}
      <div>
        <h3 className="font-bold text-slate-800 text-sm leading-snug mb-1">{item.name}</h3>
        {item.description && !item.isSeasonalPriceOnRequest && (
          <p className="text-xs text-slate-500">{item.description}</p>
        )}
        {item.unitLabel && (
          <span className="inline-block text-xs text-ocean font-semibold bg-ocean/10 px-2 py-0.5 rounded-md mt-1">
            {item.unitLabel}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className={`font-extrabold ${item.isSeasonalPriceOnRequest ? 'text-amber-500 text-xs' : 'text-ocean text-base'}`}>
          {priceLabel}
        </span>
        <div className="w-8 h-8 rounded-lg bg-ocean/10 group-hover:bg-ocean group-hover:text-white text-ocean flex items-center justify-center transition-colors flex-shrink-0">
          <Plus className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
}