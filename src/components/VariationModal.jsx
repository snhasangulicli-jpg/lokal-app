import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function VariationModal({ item, onSelect, onClose }) {
  return (
    <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-card border-border text-card-foreground">
        <DialogHeader>
          <DialogTitle className="text-lg">{item?.name}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Lütfen bir seçenek belirleyin
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2.5 pt-1">
          {item?.variations?.map((v) => (
            <Button
              key={v.label}
              variant="outline"
              size="lg"
              onClick={() => onSelect(v)}
              className="flex h-16 items-center justify-between border-border bg-background/40 px-5 text-base font-medium hover:border-primary hover:bg-primary/10 hover:text-foreground"
            >
              <span>{v.label}</span>
              <span className="text-primary font-bold">
                {(v.price ?? 0).toLocaleString("tr-TR")} TL
              </span>
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}