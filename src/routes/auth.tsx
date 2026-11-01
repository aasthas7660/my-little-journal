import { useState } from "react";
import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import "@lovable.dev/cloud-auth-js/styles.css";
import { JournalBrand } from "@/components/app-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { pageHead } from "@/lib/head";
import hero from "@/assets/auth-heart.png";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search.mode === "signup" ? ("signup" as const) : ("signin" as const),
  }),
  head: () =>
    pageHead(
      "Sign in — My Little Journal ♡",
      "Sign in to your little journal, or create an account to start writing.",
    ),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState<string | null>(null);

  async function handleSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  async function handleSignUp(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      toast.error("Please choose a password with at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName.trim() || email.split("@")[0] },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        navigate({ to: "/" });
      } else {
        setConfirmEmail(email);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleSocial(provider: "google" | "lovable") {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      if (result.redirected) return; // full-page flow: the browser takes over
      navigate({ to: "/" });
    } finally {
      setBusy(false);
    }
  }

  if (confirmEmail) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <img src={hero} alt="" className="w-24 animate-float rounded-2xl" />
            <h1 className="font-serif text-2xl font-semibold">Check your inbox ♡</h1>
            <p className="text-sm leading-relaxed text-muted-foreground">
              We sent a confirmation link to <span className="font-medium">{confirmEmail}</span>.
              Click it to open your journal, then sign in.
            </p>
            <Button variant="outline" className="rounded-full" onClick={() => setConfirmEmail(null)}>
              Back to sign in
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <JournalBrand className="text-3xl" />
        <p className="font-serif text-sm italic text-muted-foreground">
          your soft little corner of the internet
        </p>
      </div>

      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-soft">
        <CardContent className="p-6 md:p-8">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid w-full grid-cols-2 rounded-full">
              <TabsTrigger value="signin" className="rounded-full">
                Sign in
              </TabsTrigger>
              <TabsTrigger value="signup" className="rounded-full">
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full rounded-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
                </Button>
                <p className="text-center text-sm">
                  <Link
                    to="/forgot-password"
                    className="text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot your password?
                  </Link>
                </p>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="mt-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="signup-name">What should we call you?</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Aastha"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    required
                    minLength={6}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full rounded-full">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create my journal"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or continue with
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => handleSocial("google")}
              className="w-full rounded-full bg-card"
            >
              <span className="mr-2 font-serif text-base font-bold text-soft-purple">G</span>
              Continue with Google
            </Button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleSocial("lovable")}
              className="lovable-auth-button w-full"
            >
              Continue with Lovable
            </button>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Mail className="h-3.5 w-3.5" />
        Your journal stays private — entries are visible only to you.
      </p>
    </div>
  );
}
