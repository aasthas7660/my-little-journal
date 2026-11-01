
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, Save, UserRound } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: profile, isLoading, isError } = useQuery(profileQuery());

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const name = displayName ?? profile?.display_name ?? "";

  const saveProfile = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;
      if (!userData.user) throw new Error("Please sign in first.");

      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim() })
        .eq("id", userData.user.id);

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      await queryClient.invalidateQueries({ queryKey: ["current-user"] });
      setDisplayName(null);
      setMessage("Your profile has been updated ♡");
    },
    onError: (error) => {
      setMessage(error.message || "Could not update your profile.");
    },
  });

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    queryClient.clear();
    await navigate({ to: "/auth" });
  }

  if (isLoading) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        Opening your settings...
      </p>
    );
  }

  if (isError || !profile) {
    return (
      <Card className="rounded-3xl">
        <CardContent className="p-8 text-center text-muted-foreground">
          We couldn't load your profile. Please try again.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm text-primary">Your little corner ♡</p>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your journal profile and account.
        </p>
      </section>

      <Card className="rounded-3xl">
        <CardContent className="space-y-5 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary">
              <UserRound className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold">
                Your profile
              </h2>
              <p className="text-sm text-muted-foreground">
                A name for your journal.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="displayName"
              className="text-sm font-medium"
            >
              Display name
            </label>
            <input
              id="displayName"
              value={name}
              onChange={(event) => {
                setDisplayName(event.target.value);
                setMessage("");
              }}
              placeholder="Enter your name..."
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          <Button
            className="rounded-full"
            onClick={() => {
              setMessage("");
              saveProfile.mutate();
            }}
            disabled={saveProfile.isPending || !name.trim()}
          >
            <Save className="mr-2 h-4 w-4" />
            {saveProfile.isPending ? "Saving..." : "Save changes"}
          </Button>

          {message && (
            <p className="text-sm text-muted-foreground">{message}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardContent className="space-y-4 p-5 sm:p-7">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-primary" />
            <h2 className="font-serif text-xl font-semibold">
              Your little journal
            </h2>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            This is your personal space for thoughts, memories, dreams and
            feelings. Keep writing and keep growing.
          </p>

          <p className="font-serif text-sm text-primary">
            Written with love, just for you ♡
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-destructive/20">
        <CardContent className="space-y-3 p-5 sm:p-7">
          <h2 className="font-serif text-xl font-semibold">
            Account
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign out of your journal on this device.
          </p>

          <Button
            variant="outline"
            className="rounded-full"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
