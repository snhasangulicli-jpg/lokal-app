import React from 'react';
import { X, Check } from 'lucide-react';

export default function VariationModal({ item, onSelect, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-navy px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-xs">Boyut seçin</p>
            <h2 className="text-white font-bold text-lg">{item.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        <div className="p-4 space-y-2">
          {item.variations.map((v) => (
            <button
              key={v.label}
              onClick={() => onSelect(v)}
              className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-slate-200 hover:border-ocean hover:bg-ocean/5 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-ocean/10 group-hover:bg-ocean group-hover:text-white text-ocean flex items-center justify-center transition-colors">
                  <Check className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="font-bold text-slate-800">{v.label}</span>
              </div>
              <span className="font-extrabold text-ocean text-lg">{v.price.toLocaleString('tr-TR')} TL</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}