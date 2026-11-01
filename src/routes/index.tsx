import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookText, CalendarDays, Feather, MailHeart, NotebookPen, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppHeader, JournalBrand } from "@/components/app-header";
import { PhotoThumb } from "@/components/photo-thumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatEntryDate,
  formatShortDate,
  todayISO,
  type DiaryEntry,
  type Profile,
} from "@/lib/diary";
import { entriesQuery, profileQuery } from "@/lib/queries";
import { moodInfo } from "@/lib/moods";
import { pageHead } from "@/lib/head";
import hero from "@/assets/welcome-hero.png";

type AuthState = "checking" | "in" | "out";

export const Route = createFileRoute("/")({
  head: () =>
    pageHead(
      "My Little Journal ♡ — a soft place for your everyday thoughts",
      "A dreamy little private diary: write daily entries with moods and photos, keep an archive, and leave letters to your future self.",
    ),
  component: Index,
});

function Index() {
  const [authState, setAuthState] = useState<AuthState>("checking");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthState(data.user ? "in" : "out");
    });
  }, []);

  if (authState === "checking") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
        <JournalBrand className="animate-pulse text-3xl" />
        <p className="text-sm text-muted-foreground">Opening your journal…</p>
      </div>
    );
  }

  return authState === "in" ? <Dashboard /> : <Landing />;
}

function Landing() {
  return (
    <div className="min-h-screen">
      <AppHeader variant="guest" />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 md:pt-14">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="animate-fade-up">
            <p className="font-serif text-lg italic text-soft-purple">
              your soft little corner of the internet
            </p>
            <h1 className="mt-3 font-serif text-5xl font-semibold leading-tight text-foreground md:text-6xl">
              My Little Journal <span className="text-primary">♡</span>
            </h1>
            <p className="mt-5 max-w-md leading-relaxed text-muted-foreground">
              Write a little every day. Pick a mood, tuck in a photo, and let your thoughts
              rest somewhere safe — private by default, and yours on every device.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="rounded-full">
                <Link to="/auth" search={{ mode: "signup" }}>
                  Begin your journal
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="rounded-full">
                <Link to="/auth">I already have one</Link>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Entries are private to your account — only you can read them.
            </p>
          </div>
          <img
            src={hero}
            alt="A dreamy pastel illustration of a journal"
            className="mx-auto w-full max-w-md animate-float rounded-3xl shadow-soft"
          />
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: NotebookPen, title: "Daily pages", text: "Moods, prompts and photos." },
            { icon: BookText, title: "Archive", text: "Search and revisit memories." },
            { icon: CalendarDays, title: "Calendar", text: "See which days you wrote." },
            { icon: MailHeart, title: "Letters", text: "Notes to your future self." },
          ].map((f) => (
            <Card key={f.title} className="lift rounded-3xl border-border/60 shadow-card">
              <CardContent className="p-5">
                <f.icon className="h-6 w-6 text-soft-purple" />
                <h3 className="mt-3 font-serif text-lg font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}

function Dashboard() {
  const { data: profile } = useQuery<Profile>({ ...profileQuery(), retry: false });
  const { data: entries } = useQuery<DiaryEntry[]>({ ...entriesQuery({ limit: 6 }) });

  const today = todayISO();
  const todaysEntry = entries?.find((e) => e.entry_date === today);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = profile?.display_name?.trim();

  return (
    <div className="animate-fade-up">
      <section className="gradient-dreamy rounded-3xl p-6 shadow-card md:p-10">
        <p className="text-sm font-medium text-muted-foreground">{formatEntryDate(today)}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold text-foreground md:text-5xl">
          {greeting}
          {name ? `, ${name}` : ""} <span className="text-soft-purple">♡</span>
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
          {todaysEntry
            ? "You've already written today — come back and add more whenever you like."
            : "The page is waiting for you. How was your day?"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {todaysEntry ? (
            <Button asChild className="rounded-full">
              <Link to="/write" search={{ id: todaysEntry.id }}>
                <Feather className="mr-2 h-4 w-4" /> Edit today's entry
              </Link>
            </Button>
          ) : (
            <Button asChild className="rounded-full">
              <Link to="/write">
                <Feather className="mr-2 h-4 w-4" /> Write today's entry
              </Link>
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-full bg-card/70">
            <Link to="/calendar">Journal calendar</Link>
          </Button>
        </div>
        <p className="mt-6 font-serif text-base italic text-foreground/80">
          <Sparkles className="mr-1 inline h-4 w-4 text-soft-purple" />
          {quoteOfTheDaySafe()}
        </p>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold">Recent entries</h2>
          <Link to="/archive" className="text-sm font-medium text-soft-purple underline-offset-4 hover:underline">
            View all
          </Link>
        </div>

        {!entries ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Card className="h-40 animate-pulse rounded-3xl bg-secondary/60" />
            <Card className="h-40 animate-pulse rounded-3xl bg-secondary/60" />
          </div>
        ) : entries.length === 0 ? (
          <Card className="mt-4 rounded-3xl border-border/60 shadow-card">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <img src={hero} alt="" className="w-28 animate-float rounded-2xl" />
              <h3 className="font-serif text-xl font-semibold">Your journal is empty</h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                Every big story starts with one small page. Write your very first entry today.
              </p>
              <Button asChild className="rounded-full">
                <Link to="/write">Write my first entry</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => {
              const mood = moodInfo(entry.mood);
              const excerpt = entry.content.replace(/\s+/g, " ").slice(0, 120);
              return (
                <Card
                  key={entry.id}
                  className="lift rounded-3xl border-border/60 shadow-card"
                >
                  <CardContent className="flex gap-4 p-5">
                    {entry.photo_url ? (
                      <PhotoThumb
                        path={entry.photo_url}
                        alt=""
                        className="h-24 w-24 shrink-0 rounded-2xl"
                      />
                    ) : (
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-secondary text-4xl">
                        {mood.emoji}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        {mood.emoji} {formatShortDate(entry.entry_date)}
                      </p>
                      <h3 className="mt-1 truncate font-serif text-lg font-semibold">
                        {entry.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {excerpt || "A quiet little page."}
                      </p>
                      <Link
                        to="/write"
                        search={{ id: entry.id }}
                        className="mt-2 inline-block text-xs font-medium text-soft-purple underline-offset-4 hover:underline"
                      >
                        Open entry
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          { to: "/archive", icon: BookText, title: "Archive", text: "Search every page you've written." },
          { to: "/calendar", icon: CalendarDays, title: "Calendar", text: "Spot the days you kept." },
          { to: "/letters", icon: MailHeart, title: "Letters", text: "Say something to future you." },
        ].map((tile) => (
          <Link
            key={tile.to}
            to={tile.to}
            className="lift rounded-3xl border border-border/60 bg-card p-5 shadow-card"
          >
            <tile.icon className="h-6 w-6 text-soft-purple" />
            <h3 className="mt-3 font-serif text-lg font-semibold">{tile.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{tile.text}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

// quoteOfTheDay is client-only (uses Date), but this component only renders
// after the auth check on the client, so it is safe to call directly.
import { quoteOfTheDay } from "@/lib/diary";
function quoteOfTheDaySafe() {
  return quoteOfTheDay();
}
