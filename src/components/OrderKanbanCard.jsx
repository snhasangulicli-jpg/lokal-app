import { Loader2, CheckCircle2, AlertTriangle, Check } from "lucide-react";
import {
  MENU_TYPE_LABELS,
  MENU_TYPE_BADGE,
  KITCHEN_STAGES,
  REQUIRED_STAGES,
  isOrderStuck,
  getCheckedStages,
} from "@/lib/menu";
import { cn } from "@/lib/utils";

export default function OrderKanbanCard({ order, soldOutNames, onToggleStage, onComplete, busy }) {
  const menuType = order.menuType || "individual";
  const menuLabel = MENU_TYPE_LABELS[menuType] || "Tek";
  const badgeClass = MENU_TYPE_BADGE[menuType] || MENU_TYPE_BADGE.individual;
  const isIndividual = menuType === "individual";
  const stuck = isOrderStuck(order);
  const checked = getCheckedStages(order);
  const stages = KITCHEN_STAGES.filter((s) => REQUIRED_STAGES.includes(s.stage));

  return (
    <div className="select-none rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="rounded-lg bg-primary/10 px-2 py-0.5 text-sm font-bold text-primary">
            Masa {order.tableNumber}
          </span>
          {stuck && (
            <span
              className="flex items-center gap-1 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-400"
              title="Bu sipariş uzun süredir bekliyor"
            >
              <AlertTriangle className="h-3 w-3" /> Bekliyor
            </span>
          )}
        </div>
        <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", badgeClass)}>
          {menuLabel}
        </span>
      </div>

      {order.waiterName && (
        <p className="mt-1.5 text-[11px] text-muted-foreground">👤 {order.waiterName}</p>
      )}

      <div className="mt-2 space-y-0.5">
        {(order.items || []).map((item, i) => {
          const soldOut = soldOutNames?.has(item.name);
          return (
            <p
              key={i}
              className={cn(
                "text-xs",
                soldOut ? "font-semibold text-red-400 line-through" : "text-muted-foreground"
              )}
            >
              {item.quantity}× {item.name}
              {item.variationLabel ? ` (${item.variationLabel})` : ""}
              {soldOut && <span className="ml-1">— Tükendi</span>}
            </p>
          );
        })}
      </div>

      <div className="mt-1.5 text-right">
        <span className="text-xs font-bold text-foreground">
          {order.totalAmount?.toLocaleString("tr-TR") || 0} TL
        </span>
      </div>

      {isIndividual ? (
        <button
          onClick={() => onComplete(order)}
          disabled={busy}
          className={cn(
            "mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-green-700",
            busy && "opacity-50"
          )}
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          Servise Hazır
        </button>
      ) : (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
            <span>İlerleme</span>
            <span className="font-semibold text-foreground">
              {checked.size}/{stages.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {stages.map((s) => {
              const isDone = checked.has(s.stage);
              return (
                <button
                  key={s.stage}
                  onClick={() => onToggleStage(order, s.stage)}
                  disabled={busy}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors",
                    isDone
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : "border-border bg-secondary/40 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
                      isDone ? "border-green-500 bg-green-500 text-white" : "border-border"
                    )}
                  >
                    {isDone && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span className="text-base">{s.emoji}</span>
                  <span className="flex-1">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}