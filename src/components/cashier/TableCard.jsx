import { Receipt, Users } from "lucide-react";

export default function TableCard({ table, onClose }) {
  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-sm font-bold">M{table.tableNumber}</span>
          </div>
          <div>
            <p className="text-sm font-semibold">Masa {table.tableNumber}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" /> {table.orderCount} sipariş
            </p>
          </div>
        </div>
        <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
          Aktif
        </span>
      </div>

      <div className="min-h-0 flex-1 space-y-1">
        {table.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="truncate">
              {item.quantity}× {item.name}
              {item.variationLabel ? ` (${item.variationLabel})` : ""}
            </span>
            <span className="ml-2 shrink-0 font-medium text-muted-foreground">
              {item.totalPrice.toLocaleString("tr-TR")} TL
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 border-t border-border pt-3">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Receipt className="h-4 w-4" /> Genel Toplam
          </span>
          <span className="text-lg font-bold text-primary">
            {table.totalAmount.toLocaleString("tr-TR")} TL
          </span>
        </div>
        <button
          onClick={() => onClose(table)}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.98]"
        >
          Hesabı Kapat
        </button>
      </div>
    </div>
  );
}