import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export default function CloseAccountDialog({ table, processing, onConfirm, onClose }) {
  const [mode, setMode] = useState(null);
  const [customerName, setCustomerName] = useState("");

  if (!table) return null;

  const canConfirm = mode === "paid" || (mode === "debt" && customerName.trim().length > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm(mode, mode === "debt" ? customerName.trim() : "");
  };

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Masa {table.tableNumber} — Hesap Kapat</DialogTitle>
          <DialogDescription>
            Toplam:{" "}
            <span className="font-bold text-primary">
              {table.totalAmount.toLocaleString("tr-TR")} TL
            </span>{" "}
            · {table.orderCount} sipariş
          </DialogDescription>
        </DialogHeader>

        {!mode ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setMode("paid")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 transition-colors hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
              <span className="text-sm font-semibold text-emerald-400">Ödendi</span>
            </button>
            <button
              onClick={() => setMode("debt")}
              className="flex flex-col items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 transition-colors hover:bg-amber-500/20"
            >
              <AlertTriangle className="h-8 w-8 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Borç Kaldı</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {mode === "debt" && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Müşteri Adı Soyadı</label>
                <Input
                  autoFocus
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz"
                />
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMode(null)}
                disabled={processing}
              >
                Geri
              </Button>
              <Button
                className="flex-1"
                disabled={!canConfirm || processing}
                onClick={handleConfirm}
              >
                {processing
                  ? "Kaydediliyor..."
                  : mode === "paid"
                  ? "Ödendi olarak kapat"
                  : "Borç kaydet ve kapat"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}