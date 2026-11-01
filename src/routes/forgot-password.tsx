import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { JournalBrand } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/forgot-password")({
  head: () =>
    pageHead(
      "Reset your password — My Little Journal ♡",
      "Ask for a password reset link for your little journal.",
    ),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <JournalBrand className="mb-6 text-3xl" />
      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6 md:p-8">
          {sent ? (
            <div className="space-y-4 text-center">
              <h1 className="font-serif text-2xl font-semibold">Check your inbox ♡</h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                If an account exists for <span className="font-medium">{email}</span>, a reset
                link is on its way. Open it to choose a new password.
              </p>
              <Button variant="outline" className="rounded-full" onClick={() => navigate({ to: "/auth" })}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <h1 className="font-serif text-2xl font-semibold">Forgot your password?</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Enter your email and we'll send you a gentle reset link.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full rounded-full">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
              </Button>
              <p className="text-center text-sm">
                <Link
                  to="/auth"
                  className="text-muted-foreground underline-offset-4 hover:underline"
                >
                  Back to sign in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
