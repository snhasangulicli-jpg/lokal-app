import React from 'react';
import { Clock, CheckCircle2, MapPin } from 'lucide-react';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function minutesAgo(dateStr) {
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d.getTime()) / 60000);
}

export default function OrderCard({ order, onComplete, hidePrices }) {
  const mins = minutesAgo(order.created_date);
  const isUrgent = mins >= 10;
  const [completing, setCompleting] = React.useState(false);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await onComplete(order.id);
    } catch (e) {
      setCompleting(false);
    }
  };

  return (
    <div className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden flex flex-col ${isUrgent ? 'border-accent' : 'border-amber-300'}`}>
      {/* Card header */}
      <div className={`px-4 py-3 flex items-center justify-between ${isUrgent ? 'bg-accent/10' : 'bg-amber-50'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUrgent ? 'bg-accent text-white' : 'bg-amber-400 text-white'}`}>
            <MapPin className="w-5 h-5" strokeWidth={2} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium leading-tight">Masa</p>
            <p className="font-extrabold text-lg text-slate-800 leading-tight">{order.tableNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-slate-500">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{formatTime(order.created_date)}</span>
          <span className={`text-xs font-bold ml-1 ${isUrgent ? 'text-accent' : 'text-amber-500'}`}>({mins} dk)</span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-3 flex-1">
        <div className="space-y-2">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-start justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-7 h-7 rounded-lg bg-ocean/10 text-ocean font-bold text-sm flex items-center justify-center">
                  {item.quantity}
                </span>
                <div>
                  <p className="font-semibold text-slate-800 text-sm leading-tight">{item.name}</p>
                  {item.variationLabel && (
                    <p className="text-xs text-slate-500">{item.variationLabel}</p>
                  )}
                </div>
              </div>
              {/* ESKİ DOSYADA FİYAT ZATEN YAZMIYORDU AMA YİNE DE EKLEDİK */}
              {!hidePrices && item.totalPrice && (
                 <span className="whitespace-nowrap text-sm font-medium text-slate-500">
                   {item.totalPrice.toLocaleString("tr-TR")} TL
                 </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
        <button
          onClick={handleComplete}
          disabled={completing}
          className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          {completing ? 'İşaretleniyor...' : 'Tamamlandı Olarak İşaretle'}
        </button>
      </div>
    </div>
  );
}