import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  BookText,
  CalendarDays,
  Heart,
  Home,
  Menu,
  NotebookPen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { to: "/", label: "Home", icon: Home },
  { to: "/write", label: "Write", icon: NotebookPen },
  { to: "/archive", label: "Archive", icon: BookText },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/letters", label: "Letters", icon: Heart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function JournalBrand({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl",
        className,
      )}
    >
      My Little Journal <span className="text-primary">♡</span>
    </Link>
  );
}

function NavLink({
  to,
  label,
  icon: Icon,
  active,
  onNavigate,
  className,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-secondary text-foreground shadow-card"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

/** App header. Full navigation for signed-in pages, a soft guest bar for the landing page. */
export function AppHeader({ variant = "app" }: { variant?: "app" | "guest" }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4">
        <JournalBrand />

        {variant === "app" ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={pathname === item.to}
                />
              ))}
            </nav>

            <div className="md:hidden">
              <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Open menu">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72">
                  <SheetTitle className="font-serif text-xl font-semibold">
                    My Little Journal <span className="text-primary">♡</span>
                  </SheetTitle>
                  <nav className="mt-6 flex flex-col gap-1">
                    {NAV_ITEMS.map((item) => (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        label={item.label}
                        icon={item.icon}
                        active={pathname === item.to}
                        onNavigate={() => setOpen(false)}
                        className="px-4 py-3 text-base"
                      />
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </>
        ) : (
          <Button asChild className="rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  );
}
