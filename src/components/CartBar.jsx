import { useState } from "react";
import { Minus, Plus, ShoppingCart, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CartBar({
  cart,
  tableNumber,
  onTableChange,
  orderNote,
  onNoteChange,
  onInc,
  onDec,
  onRemove,
  onSend,
  sending,
  hidePrices
}) {
  const [open, setOpen] = useState(false);
  
  const safeCart = cart || [];
  const count = safeCart.reduce((s, i) => s + (i.quantity || 0), 0);
  const total = safeCart.reduce((s, i) => s + (i.totalPrice || 0), 0);

  const handleSendClick = () => {
    if (onSend) onSend();
    setOpen(false); 
  };

  return (
    <>
      <div className="sticky bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.25)]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setOpen(true)}
            className="relative h-14 flex-1 justify-start gap-3 rounded-2xl"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="font-semibold">{count} ürün</span>
            
            {!hidePrices && count > 0 && (
              <span className="ml-auto text-lg font-bold text-primary">
                {total.toLocaleString("tr-TR")} TL
              </span>
            )}
          </Button>
          <Button
            size="lg"
            onClick={() => setOpen(true)}
            disabled={count === 0 || sending}
            className="h-14 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <Send className="mr-2 h-5 w-5" />
            Mutfağa Gönder
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col bg-card border-border text-card-foreground sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Sipariş Özeti</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Sepeti kontrol edip mutfağa gönderin
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            
            {/* AKILLI MASA SEÇİMİ BAŞLANGICI */}
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Masa Seçimi *</span>
                <span className="text-[10px] lowercase text-muted-foreground/70">Sabit 8 Masa</span>
              </Label>
              
              {/* SABİT MASALAR İÇİN HIZLI BUTONLAR */}
              <div className="grid grid-cols-4 gap-2 mb-1">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onTableChange && onTableChange(String(num))}
                    className={`h-11 rounded-xl text-lg font-bold border transition-all active:scale-95 ${
                      tableNumber === String(num)
                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                        : "bg-secondary/50 border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>

              {/* TOMBALA GÜNLERİ VEYA ÖZEL MASALAR İÇİN MANUEL GİRİŞ */}
              <Input
                id="table"
                inputMode="text"
                autoCapitalize="words"
                value={tableNumber || ""}
                onChange={(e) => onTableChange && onTableChange(e.target.value)}
                placeholder="Diğer masalar için yazın (Örn: 14, Bahçe 2)"
                className="h-10 bg-background/40 border-border text-sm font-medium"
              />
            </div>
            {/* AKILLI MASA SEÇİMİ BİTİŞİ */}

            <div className="space-y-1.5 pt-2 border-t border-border/50">
              <Label htmlFor="note" className="text-xs uppercase tracking-wider text-muted-foreground">
                Özel İstek / Sipariş Notu <span className="text-[10px] lowercase text-muted-foreground/70">(İsteğe Bağlı)</span>
              </Label>
              <Input
                id="note"
                inputMode="text"
                autoCapitalize="sentences"
                value={orderNote || ""}
                onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
                placeholder="örn. Salata soğansız olsun, az pişmiş..."
                className="h-11 bg-amber-500/5 border-amber-500/20 placeholder:text-amber-500/40 text-sm focus-visible:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin mt-2">
            {safeCart.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sepet boş. Ürün ekleyin.
              </p>
            ) : (
              <div className="space-y-2">
                {safeCart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      {item.variationLabel && (
                        <p className="text-xs text-muted-foreground">{item.variationLabel}</p>
                      )}
                      
                      {!hidePrices && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(item.unitPrice ?? 0).toLocaleString("tr-TR")} TL / adet
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onDec && onDec(idx)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-7 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onInc && onInc(idx)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove && onRemove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    {!hidePrices && (
                      <span className="w-24 text-right text-sm font-bold text-primary">
                        {(item.totalPrice ?? 0).toLocaleString("tr-TR")} TL
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {!hidePrices && (
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Toplam</span>
              <span className="text-2xl font-bold text-primary">
                {total.toLocaleString("tr-TR")} TL
              </span>
            </div>
          )}

          <Button
            size="lg"
            disabled={safeCart.length === 0 || !tableNumber?.trim() || sending}
            onClick={handleSendClick}
            className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90 mt-2"
          >
            {sending 
              ? "Gönderiliyor..." 
              : hidePrices 
                ? "Mutfağa Gönder" 
                : `Mutfağa Gönder — ${total.toLocaleString("tr-TR")} TL`
            }
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}