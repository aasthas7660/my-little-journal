import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JournalBrand } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/reset-password")({
  head: () =>
    pageHead(
      "Choose a new password — My Little Journal ♡",
      "Set a new password for your little journal.",
    ),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [recovery, setRecovery] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    setRecovery(hash.get("type") === "recovery" || query.get("type") === "recovery");
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Please choose a password with at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("The two passwords don't match yet.");
      return;
    }
    setBusy(true);
    try {
      // Recovery sessions are exempt from the current-password check.
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Your new password is saved ♡");
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <JournalBrand className="mb-6 text-3xl" />
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6 md:p-8">
          {recovery === null ? (
            <p className="text-center text-sm text-muted-foreground">Opening your reset link…</p>
          ) : recovery === false ? (
            <div className="space-y-4 text-center">
              <h1 className="font-serif text-2xl font-semibold">This link has expired</h1>
              <p className="text-sm text-muted-foreground">
                Password reset links only work once. Ask for a fresh one and try again.
              </p>
              <Button asChild className="rounded-full">
                <a href="/forgot-password">Request a new link</a>
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Choose a new password</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pick something kind but strong — at least 6 characters.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-password">New password</Label>
                <Input
                  id="reset-password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="reset-confirm">Confirm new password</Label>
                <Input
                  id="reset-confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save new password"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
