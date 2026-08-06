import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { Anchor, Delete, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [logoClicks, setLogoClicks] = useState(0);

  // Logoya 3 kere tıklama kontrolü (Gizli Admin Modu)
  const handleLogoClick = () => {
    setLogoClicks((prev) => prev + 1);
  };

  const adminUnlocked = logoClicks >= 3;

  // Şifre 4 haneye ulaştığında otomatik kontrol et
  useEffect(() => {
    if (pin.length === 4) {
      handleLogin(pin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleLogin = (enteredPin) => {
    if (!name.trim()) {
      setError("Lütfen önce adınızı girin.");
      setPin("");
      return;
    }

    let role = null;
    let redirectPath = "/";

    // Şifreye Göre Rol Belirleme
    if (enteredPin === "0000") {
      role = "garson";
      redirectPath = "/order";
    } else if (enteredPin === "1111") {
      role = "mutfak";
      redirectPath = "/";
    } else if (enteredPin === "7991") {
      role = "kasa";
      redirectPath = "/cashier";
    } else if (enteredPin === "1571" && adminUnlocked) {
      role = "admin";
      redirectPath = "/admin";
    }

    // Doğru şifre ise giriş yap, değilse hata ver
    if (role) {
      login({ name: name.trim(), role: role });
      setTimeout(() => navigate(redirectPath, { replace: true }), 150);
    } else {
      setError("Hatalı Şifre");
      setTimeout(() => {
        setPin("");
        setError("");
      }, 800);
    }
  };

  const handlePadClick = (val) => {
    if (pin.length < 4) {
      setPin((prev) => prev + val);
      setError("");
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
        
        {/* LOGO (Gizli Buton) */}
        <div className="mb-6 flex flex-col items-center text-center">
          <div 
            onClick={handleLogoClick}
            className={cn(
              "mb-4 flex h-16 w-16 cursor-pointer items-center justify-center rounded-2xl shadow-lg transition-transform active:scale-95",
              adminUnlocked 
                ? "bg-amber-500 text-white shadow-amber-500/20" 
                : "bg-primary text-primary-foreground shadow-primary/20"
            )}
          >
            <Anchor className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Karaoğlanoğlu Lokali</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sisteme girmek için adınızı ve şifrenizi girin
          </p>
        </div>

        <div className="space-y-6">
          {/* İSİM GİRİŞİ */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">Ad Soyad</Label>
            <Input
              id="name"
              autoFocus
              autoComplete="off"
              placeholder="Örn: Barış"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className="h-12 text-base bg-background"
            />
          </div>

          {/* PIN GÖSTERGESİ */}
          <div className="pt-2">
            <div className={cn("flex justify-center gap-4", error === "Hatalı Şifre" && "animate-shake")}>
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={cn(
                    "h-4 w-4 rounded-full transition-all duration-300",
                    pin.length > i 
                      ? error 
                        ? "bg-red-500 scale-110 shadow-[0_0_10px_rgba(239,68,68,0.5)]" 
                        : "bg-primary scale-110 shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                      : "bg-muted"
                  )}
                />
              ))}
            </div>
            
            {/* HATA MESAJI */}
            <div className="mt-4 flex h-5 items-center justify-center">
              {error && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-red-500">
                  <AlertCircle className="h-4 w-4" /> {error}
                </span>
              )}
            </div>
          </div>

          {/* NUMPAD (TUŞ TAKIMI) */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handlePadClick(num.toString())}
                className="flex h-14 items-center justify-center rounded-2xl bg-secondary text-xl font-semibold text-foreground transition-colors hover:bg-secondary/80 active:bg-primary active:text-primary-foreground sm:h-16 sm:text-2xl"
              >
                {num}
              </button>
            ))}
            <div className="flex items-center justify-center"></div>
            <button
              type="button"
              onClick={() => handlePadClick("0")}
              className="flex h-14 items-center justify-center rounded-2xl bg-secondary text-xl font-semibold text-foreground transition-colors hover:bg-secondary/80 active:bg-primary active:text-primary-foreground sm:h-16 sm:text-2xl"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground active:bg-destructive active:text-destructive-foreground sm:h-16"
            >
              <Delete className="h-6 w-6 sm:h-7 sm:w-7" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}