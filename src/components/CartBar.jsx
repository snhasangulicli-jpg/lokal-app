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
  orderNote,       // <-- Sipariş notunu props olarak aldık
  onNoteChange,    // <-- Not değiştirme fonksiyonunu props olarak aldık
  onInc,
  onDec,
  onRemove,
  onSend,
  sending,
}) {
  const [open, setOpen] = useState(false);
  const count = cart.reduce((s, i) => s + i.quantity, 0);
  const total = cart.reduce((s, i) => s + i.totalPrice, 0);

  // Gönderme işlemi bitince (veya basılınca) çalışacak sarmalayıcı fonksiyon
  const handleSendClick = () => {
    onSend();
    // Opsiyonel: Başarılı olursa diye dialogu kapatabiliriz (şu an sending state'ine bağlı)
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
            {count > 0 && (
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

          {/* MASA NUMARASI VE SİPARİŞ NOTU ALANI */}
          <div className="space-y-4 pt-2">
            
            {/* Masa Numarası */}
            <div className="space-y-1.5">
              <Label htmlFor="table" className="text-xs uppercase tracking-wider text-muted-foreground">
                Masa Numarası *
              </Label>
              <Input
                id="table"
                inputMode="text"
                autoCapitalize="words"
                value={tableNumber}
                onChange={(e) => onTableChange(e.target.value)}
                placeholder="örn. Bahçe 5"
                className="h-12 bg-background/40 border-border text-lg font-semibold"
              />
            </div>

            {/* Sipariş Notu (Özel İstek) */}
            <div className="space-y-1.5">
              <Label htmlFor="note" className="text-xs uppercase tracking-wider text-muted-foreground">
                Özel İstek / Sipariş Notu <span className="text-[10px] lowercase text-muted-foreground/70">(İsteğe Bağlı)</span>
              </Label>
              <Input
                id="note"
                inputMode="text"
                autoCapitalize="sentences"
                value={orderNote || ""} // orderNote undefined gelirse boş string göster
                onChange={(e) => onNoteChange(e.target.value)}
                placeholder="örn. Salata soğansız olsun, az pişmiş..."
                className="h-11 bg-amber-500/5 border-amber-500/20 placeholder:text-amber-500/40 text-sm focus-visible:ring-amber-500/30"
              />
            </div>

          </div>

          {/* SEPET ÜRÜNLERİ LİSTESİ */}
          <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin mt-2">
            {cart.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Sepet boş. Ürün ekleyin.
              </p>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background/40 p-3"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      {item.variationLabel && (
                        <p className="text-xs text-muted-foreground">{item.variationLabel}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {(item.unitPrice ?? 0).toLocaleString("tr-TR")} TL / adet
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="secondary"
                        className="h-8 w-8 rounded-lg"
                        onClick={() => onDec(idx)}
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
                        onClick={() => onInc(idx)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-destructive"
                        onClick={() => onRemove(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <span className="w-24 text-right text-sm font-bold text-primary">
                      {(item.totalPrice ?? 0).toLocaleString("tr-TR")} TL
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Toplam</span>
            <span className="text-2xl font-bold text-primary">
              {total.toLocaleString("tr-TR")} TL
            </span>
          </div>

          <Button
            size="lg"
            disabled={cart.length === 0 || !tableNumber.trim() || sending}
            onClick={handleSendClick}
            className="h-14 w-full rounded-2xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/90"
          >
            {sending ? "Gönderiliyor..." : `Mutfağa Gönder — ${total.toLocaleString("tr-TR")} TL`}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}