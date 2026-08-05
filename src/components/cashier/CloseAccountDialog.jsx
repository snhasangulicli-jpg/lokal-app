import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, AlertTriangle, Calculator, UserSearch, History, Check } from "lucide-react";

export default function CloseAccountDialog({ table, processing, onConfirm, onClose }) {
  const { toast } = useToast();
  const [mode, setMode] = useState(null); // 'paid', 'debt' veya 'partial'
  const [customerName, setCustomerName] = useState("");
  
  // Parçalı Ödeme ve Para Üstü State'leri
  const [paidAmount, setPaidAmount] = useState("");
  const [givenAmount, setGivenAmount] = useState("");
  
  // Döviz Kur State'leri 
  const [currency, setCurrency] = useState("TL"); 
  const [exchangeRate, setExchangeRate] = useState(""); 
  
  // Eski Borçlar State'i
  const [pastDebts, setPastDebts] = useState([]);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [closingOldDebt, setClosingOldDebt] = useState(null); // Kapatılan borcun ID'sini tutar

  // Modal kapandığında state'leri sıfırla
  useEffect(() => {
    if (!table) {
      setMode(null);
      setCustomerName("");
      setPaidAmount("");
      setGivenAmount("");
      setCurrency("TL");
      setExchangeRate("");
      setPastDebts([]);
    } else {
      setPaidAmount(table.totalAmount.toString());
    }
  }, [table]);

  // Müşteri adı yazıldıkça eski borçları Supabase'den ara
  useEffect(() => {
    if (customerName.length > 2 && mode !== 'paid') {
      const searchDebts = async () => {
        setSearchingCustomer(true);
        try {
          const { data, error } = await supabase
            .from("orders")
            .select("id, totalAmount, paid_amount, created_date")
            .ilike("customerName", `%${customerName.trim()}%`)
            .eq("paymentStatus", "debt")
            .order("created_date", { ascending: false });

          if (!error && data) {
            setPastDebts(data);
          }
        } catch (e) {
          console.error("Geçmiş borçlar aranırken hata:", e);
        } finally {
          setSearchingCustomer(false);
        }
      };
      
      const timeoutId = setTimeout(searchDebts, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setPastDebts([]);
    }
  }, [customerName, mode]);

  // YENİ FONKSİYON: Eski Borcu Kapatma
  const handlePayOldDebt = async (debtId, amount) => {
    setClosingOldDebt(debtId);
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          paymentStatus: "paid", 
          paid_amount: amount, // Borcun tamamını ödenmiş sayıyoruz
          paidAt: new Date().toISOString()
        })
        .eq("id", debtId);

      if (error) throw error;

      toast({ title: "Başarılı", description: "Eski borç ödendi olarak işaretlendi." });
      
      // Listeden sil (ekrandan anında kaybolsun)
      setPastDebts(prev => prev.filter(d => d.id !== debtId));
    } catch (e) {
      toast({ variant: "destructive", title: "Hata", description: "Borç kapatılamadı." });
    } finally {
      setClosingOldDebt(null);
    }
  };

  if (!table) return null;

  const total = table.totalAmount;
  const numPaid = Number(paidAmount) || 0;
  const numGiven = Number(givenAmount) || 0;
  const numRate = Number(exchangeRate) || 1;

  // Verilecek Para Üstü Hesaplama (TL cinsinden)
  let changeToGive = 0;
  if (currency === "TL") {
    changeToGive = numGiven > total ? numGiven - total : 0;
  } else {
    const givenInTL = numGiven * numRate;
    changeToGive = givenInTL > total ? givenInTL - total : 0;
  }

  // Kalan Borç Hesaplama
  const remainingDebt = total > numPaid ? total - numPaid : 0;

  const handleConfirm = () => {
    let finalMode = mode;
    if (remainingDebt > 0 && numPaid > 0) finalMode = "partial"; 
    onConfirm(finalMode, customerName.trim(), numPaid);
  };

  const isFormValid = () => {
    if (mode === "paid") return true;
    if (mode === "debt") return customerName.trim().length > 0;
    return false;
  };

  return (
    <Dialog open={!!table} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Masa {table.tableNumber} — Hesap Kapat</DialogTitle>
          <DialogDescription>
            Adisyon Toplamı:{" "}
            <span className="font-bold text-primary text-lg">
              {total.toLocaleString("tr-TR")} TL
            </span>{" "}
            · {table.orderCount} sipariş
          </DialogDescription>
        </DialogHeader>

        {!mode ? (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => { setMode("paid"); setPaidAmount(total.toString()); }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 transition-colors hover:bg-emerald-500/20"
            >
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-500">Tamamı Ödendi</span>
            </button>
            <button
              onClick={() => { setMode("debt"); setPaidAmount("0"); }}
              className="flex flex-col items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 transition-colors hover:bg-amber-500/20"
            >
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <span className="text-sm font-semibold text-amber-500">Veresiye (Borç)</span>
            </button>
          </div>
        ) : (
          <div className="space-y-6 pt-4">
            
            {/* 2. ADIM: VERESİYE VE GEÇMİŞ BORÇ KONTROLÜ */}
            {mode === "debt" && (
              <div className="space-y-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="space-y-1.5">
                  <Label className="text-amber-600 font-semibold flex items-center gap-2">
                    <UserSearch className="h-4 w-4" /> Müşteri Adı Soyadı
                  </Label>
                  <Input
                    autoFocus
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Örn: Ahmet Yılmaz"
                    className="border-amber-500/30 focus-visible:ring-amber-500/30"
                  />
                </div>

                {/* Geçmiş Borçlar Listesi */}
                {searchingCustomer ? (
                  <p className="text-xs text-muted-foreground animate-pulse">Eski borçlar aranıyor...</p>
                ) : pastDebts.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <History className="h-3 w-3" /> Bu Müşterinin Ödenmemiş Eski Borçları:
                    </Label>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {pastDebts.map(debt => {
                        const unpaid = debt.totalAmount - (debt.paid_amount || 0);
                        const isClosing = closingOldDebt === debt.id;
                        
                        return (
                          <div key={debt.id} className="flex justify-between items-center text-sm p-2 rounded bg-background/50 border border-border">
                            <div className="flex flex-col">
                              <span className="font-bold text-amber-500">{unpaid.toLocaleString("tr-TR")} TL</span>
                              <span className="text-muted-foreground text-[10px]">
                                {new Date(debt.created_date).toLocaleDateString('tr-TR')}
                              </span>
                            </div>
                            
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={isClosing}
                              onClick={() => handlePayOldDebt(debt.id, debt.totalAmount)}
                              className="h-7 text-xs bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30"
                            >
                              {isClosing ? "Kapatılıyor..." : <><Check className="mr-1 h-3 w-3"/> Kapat</>}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : customerName.length > 2 ? (
                  <p className="text-xs text-emerald-500">Bu müşterinin eski borcu bulunmuyor.</p>
                ) : null}

                {/* Parçalı Ödeme Girişi */}
                <div className="space-y-1.5 pt-2 border-t border-amber-500/20">
                  <Label className="text-sm">Bugün Alınan Peşinat (TL)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(e.target.value)}
                      placeholder="Örn: 500"
                    />
                    <div className="text-sm font-semibold w-1/2 text-right">
                      Kalan Borç: <span className="text-amber-500">{remainingDebt.toLocaleString("tr-TR")} TL</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. ADIM: PARA ÜSTÜ VE DÖVİZ HESAPLAYICI */}
            {mode === "paid" && (
              <div className="space-y-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <Label className="text-emerald-600 font-semibold flex items-center gap-2">
                  <Calculator className="h-4 w-4" /> Para Üstü Hesaplayıcı (Opsiyonel)
                </Label>
                
                <div className="grid grid-cols-3 gap-2">
                  {["TL", "GBP", "EUR", "USD"].map(c => (
                    <Button 
                      key={c}
                      type="button"
                      variant={currency === c ? "default" : "outline"}
                      className={currency === c ? "bg-emerald-500 hover:bg-emerald-600" : ""}
                      onClick={() => setCurrency(c)}
                    >
                      {c}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Müşterinin Verdiği ({currency})</Label>
                    <Input
                      type="number"
                      value={givenAmount}
                      onChange={(e) => setGivenAmount(e.target.value)}
                      placeholder="Örn: 50"
                    />
                  </div>
                  
                  {currency !== "TL" && (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Günlük Kur (1 {currency} = ? TL)</Label>
                      <Input
                        type="number"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        placeholder="Örn: 44.5"
                      />
                    </div>
                  )}
                </div>

                {numGiven > 0 && (
                  <div className="pt-2 flex justify-between items-center border-t border-emerald-500/20">
                    <span className="text-sm font-medium">Verilecek Para Üstü:</span>
                    <span className="text-xl font-bold text-emerald-500">
                      {changeToGive > 0 ? changeToGive.toLocaleString("tr-TR") : "0"} TL
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* BUTONLAR */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMode(null)}
                disabled={processing}
              >
                Geri
              </Button>
              <Button
                className={`flex-1 ${mode === "paid" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-amber-500 hover:bg-amber-600 text-white"}`}
                disabled={!isFormValid() || processing}
                onClick={handleConfirm}
              >
                {processing
                  ? "Kaydediliyor..."
                  : mode === "paid"
                  ? "Hesabı Kapat"
                  : remainingDebt > 0 && numPaid > 0 
                  ? `${remainingDebt} TL Borç Kaydet` 
                  : "Tümünü Borca Yaz"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}