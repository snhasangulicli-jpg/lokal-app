import { Link, useLocation } from "react-router-dom";
import { UtensilsCrossed, ChefHat, Anchor, Calculator, User } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Mutfak", icon: ChefHat, match: "/" },
  { to: "/order", label: "Garson", icon: UtensilsCrossed, match: "/order" },
  { to: "/cashier", label: "Kasiyer", icon: Calculator, match: "/cashier" },
  { to: "/profile", label: "Profil", icon: User, match: "/profile" },
];

export default function AppLayout({ children }) {
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background">
      {/* Üst başlık — masaüstü/tablet */}
      <header className="hidden select-none border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/60 md:flex">
        <div className="flex h-16 w-full items-center justify-between px-4 pt-[env(safe-area-inset-top)] md:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Anchor className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Karaoğlanoğlu
              </p>
              <p className="text-sm font-semibold text-foreground">
                Tekne Sahipleri & Amatör Balıkçılar Derneği Lokali
              </p>
            </div>
          </Link>

          <nav className="flex items-center gap-1.5">
            {TABS.map((t) => {
              const active = location.pathname === t.match;
              const Icon = t.icon;
              return (
                <Link
                  key={t.to}
                  to={t.to}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>

      {/* Alt tab bar — mobil */}
      <nav className="select-none border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
        <div className="flex items-stretch justify-around">
          {TABS.map((t) => {
            const active = location.pathname === t.match;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className="h-5 w-5" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}