import { useState } from "react";
import { Minus, Plus, ShoppingCart, Send, Trash2, Receipt } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

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
      <div className="sticky bottom-0 z-30 border-t border-border/80 bg-card/95 backdrop-blur-md px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.12)]">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            onClick={() => setOpen(true)}
            className="relative h-14 flex-1 justify-start gap-3 rounded-2xl bg-secondary/80 hover:bg-secondary text-foreground font-semibold px-4 shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span>{count} ürün seçildi</span>
            <Badge variant="outline" className="ml-1 bg-primary/10 text-primary border-primary/20 text-xs">
              Aktif Sepet
            </Badge>
            
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
            className="h-14 rounded-2xl bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20 transition-all active:scale-95"
          >
            <Send className="mr-2 h-5 w-5" />
            Mutfağa Gönder
          </Button>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[90vh] flex-col bg-card border-border text-card-foreground sm:max-w-lg rounded-3xl p-6 shadow-2xl">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-bold">Sipariş Özeti</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Masa seçimi yapıp sepeti kontrol edin ve mutfağa iletin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between">
                <span>Masa Seçimi *</span>
                <span className="text-[10px] font-normal lowercase text-muted-foreground/70">Sabit 8 Masa</span>
              </Label>
              
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                  <Button
                    key={num}
                    type="button"
                    variant={tableNumber === String(num) ? "default" : "outline"}
                    onClick={() => onTableChange && onTableChange(String(num))}
                    className={`h-12 rounded-xl text-base font-bold transition-all ${
                      tableNumber === String(num)
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 border-primary"
                        : "bg-secondary/40 hover:bg-secondary border-border"
                    }`}
                  >
                    M{num}
                  </Button>
                ))}
              </div>

              <Input
                id="table"
                inputMode="text"
                autoCapitalize="words"
                value={tableNumber || ""}
                onChange={(e) => onTableChange && onTableChange(e.target.value)}
                placeholder="Veya diğer masa/konum yazın (Örn: Bahçe 2)"
                className="h-11 bg-background/60 border-border text-sm font-medium rounded-xl"
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <Label htmlFor="note" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Özel İstek / Not <span className="text-[10px] font-normal lowercase text-muted-foreground/70">(İsteğe Bağlı)</span>
              </Label>
              <Input
                id="note"
                inputMode="text"
                autoCapitalize="sentences"
                value={orderNote || ""}
                onChange={(e) => onNoteChange && onNoteChange(e.target.value)}
                placeholder="örn. Salata soğansız olsun..."
                className="h-11 bg-amber-500/5 border-amber-500/20 placeholder:text-amber-500/40 text-sm rounded-xl focus-visible:ring-amber-500/30"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin my-3 space-y-2">
            {safeCart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mb-2" />
                <p className="text-sm font-medium text-muted-foreground">Sepetiniz boş. Ürün ekleyin.</p>
              </div>
            ) : (
              safeCart.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 p-3.5 shadow-sm"
                >
                  <div className="flex-1">
                    <p className="text-sm font-bold leading-tight">{item.name}</p>
                    {item.variationLabel && (
                      <Badge variant="secondary" className="mt-1 text-[10px] px-2 py-0">
                        {item.variationLabel}
                      </Badge>
                    )}
                    
                    {!hidePrices && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {(item.unitPrice ?? 0).toLocaleString("tr-TR")} TL / adet
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-xl border border-border/50">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-background"
                      onClick={() => onDec && onDec(idx)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-bold">
                      {item.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 rounded-lg hover:bg-background"
                      onClick={() => onInc && onInc(idx)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onRemove && onRemove(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  {!hidePrices && (
                    <span className="w-20 text-right text-sm font-bold text-primary">
                      {(item.totalPrice ?? 0).toLocaleString("tr-TR")} TL
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {!hidePrices && (
            <div className="flex items-center justify-between border-t border-border pt-4 px-1">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-4 w-4" /> Toplam Tutar
              </span>
              <span className="text-2xl font-black text-primary">
                {total.toLocaleString("tr-TR")} TL
              </span>
            </div>
          )}

          <Button
            size="lg"
            disabled={safeCart.length === 0 || !tableNumber?.trim() || sending}
            onClick={handleSendClick}
            className="h-14 w-full rounded-2xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20"
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