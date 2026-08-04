import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext"; // Sistemin kalbi eklendi
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Anchor, Loader2, UtensilsCrossed, ChefHat, Calculator } from "lucide-react";
import { cn } from "@/lib/utils";

// Rolleri sistemin anlayacağı (kasa, mutfak, garson) value değerleriyle eşleştirdik
const ROLES = [
  { id: "Garson", value: "garson", path: "/orders", icon: UtensilsCrossed, desc: "Sipariş al ve mutfağa gönder" },
  { id: "Mutfak", value: "mutfak", path: "/kitchen", icon: ChefHat, desc: "Sipariş takip ve hazırlık" },
  { id: "Kasiyer", value: "kasa", path: "/cashier", icon: Calculator, desc: "Hesap kapatma ve kasa" },
];

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useAuth(); // AuthContext'ten veri okuma ve yazma fonksiyonları alındı
  
  const [name, setName] = useState("");
  const [role, setRole] = useState("Garson");
  const [loading, setLoading] = useState(false);

  // Zaten giriş yapılmışsa rol ana ekranına dön
  useEffect(() => {
    if (user) {
      const activeRole = ROLES.find(r => r.value === user.role);
      if (activeRole) navigate(activeRole.path, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    // Seçilen rolün sistem (value) karşılığını ve gideceği sayfayı bul
    const selectedRoleData = ROLES.find(r => r.id === role);
    
    // AuthContext'e giriş bilgisini gönder (Hem hafızaya yazar hem sistemi uyarır)
    login({ name: name, role: selectedRoleData.value });

    // Kullanıcıyı yetkili olduğu ekrana yönlendir
    setTimeout(() => navigate(selectedRoleData.path, { replace: true }), 120);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Anchor className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Karaoğlanoğlu Lokali</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Devam etmek için adınızı ve rolünüzü seçin
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad</Label>
            <Input
              id="name"
              autoFocus
              autoComplete="off"
              placeholder="Örn: Barış"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map((r) => {
                const Icon = r.icon;
                const active = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRole(r.id)}
                    className={cn(
                      "flex select-none flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-semibold">{r.id}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {ROLES.find((r) => r.id === role)?.desc}
            </p>
          </div>

          <Button
            type="submit"
            className="h-12 w-full select-none text-base font-semibold"
            disabled={loading || !name.trim()}
          >
            {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            Giriş Yap
          </Button>
        </form>
      </div>
    </div>
  );
}