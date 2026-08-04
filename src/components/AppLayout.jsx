import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { UtensilsCrossed, ChefHat, Anchor, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Sekmeleri role göre ayarlayabilmek için ayırdık
const ALL_TABS = {
  mutfak: { to: "/", label: "Mutfak", icon: ChefHat, match: "/" },
  garson: { to: "/order", label: "Garson", icon: UtensilsCrossed, match: "/order" },
  kasa: { to: "/cashier", label: "Kasiyer", icon: Calculator, match: "/cashier" },
};

const PROFILE_TAB = { to: "/profile", label: "Profil", icon: User, match: "/profile" };

export default function AppLayout({ children }) {
  const location = useLocation();
  const { user } = useAuth(); // Giriş yapan kullanıcı bilgisi

  // Kullanıcı giriş yapmışsa sadece kendi yetkisinin tabı ve Profil tabı gözüksün
  const TABS = user && user.role 
    ? [ALL_TABS[user.role], PROFILE_TAB].filter(Boolean)
    : [PROFILE_TAB]; // Hata ihtimaline karşı fallback

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      <header className="hidden select-none border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:flex">
        <div className="flex h-16 w-full items-center justify-between px-4 pt-[env(safe-area-inset-top)] md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Anchor className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Karaoğlanoğlu</p>
              <p className="text-sm font-semibold text-foreground">Lokali Sistemi</p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  location.pathname === t.match
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <t.icon className="h-4 w-4" />
                <span>{t.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

      <nav className="select-none border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                location.pathname === t.match ? "text-primary" : "text-muted-foreground"
              )}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}