import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader } from "@/components/app-header";

// The session lives in the browser, so this gate only runs on the client.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth" });
    }
  },
  component: () => (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 md:pt-10">
        <Outlet />
      </main>
      <footer className="pb-8 text-center text-xs text-muted-foreground">
        My Little Journal ♡ — written only for you.
      </footer>
    </div>
  ),
});
