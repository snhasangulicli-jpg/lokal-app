import { useNavigate } from "react-router-dom";
import { getStaff, clearStaff } from "@/lib/staffSession";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { LogOut, UserRound } from "lucide-react";

export default function ProfileScreen() {
  const navigate = useNavigate();
  const staff = getStaff();

  const handleSignOut = () => {
    clearStaff();
    navigate("/login", { replace: true });
  };

  return (
    <AppLayout>
      <div className="flex h-full flex-col">
        <div className="border-b border-border bg-card/60 px-4 py-4 md:px-6">
          <h1 className="text-xl font-bold tracking-tight">Profil</h1>
          <p className="text-xs text-muted-foreground">Oturum bilgileri</p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-2xl px-4 py-6 md:px-6">
            <div className="select-none rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-xl font-bold">
                    {(staff?.name || "?").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">
                    {staff?.name || "İsimsiz Kullanıcı"}
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <UserRound className="h-3.5 w-3.5" /> Rol: {staff?.role || "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <Button
                onClick={handleSignOut}
                variant="destructive"
                className="h-12 w-full select-none justify-center gap-2 rounded-xl"
              >
                <LogOut className="h-5 w-5" /> Oturumu Kapat
              </Button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}