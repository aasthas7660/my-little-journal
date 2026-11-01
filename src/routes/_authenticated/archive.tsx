
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookText, Search, PenLine } from "lucide-react";

import { entriesQuery } from "@/lib/queries";
import { formatShortDate } from "@/lib/diary";
import { moodInfo } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/archive")({
  component: ArchivePage,
});

function ArchivePage() {
  const [search, setSearch] = useState("");

  const { data: entries = [], isLoading, isError } = useQuery(
    entriesQuery({ search: search.trim() || undefined }),
  );

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm text-primary">Your memories, kept safe ♡</p>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          My Diary Archive
        </h1>
        <p className="text-muted-foreground">
          Every little moment deserves a place here.
        </p>
      </section>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search your memories..."
          className="h-12 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm outline-none transition focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {isLoading ? (
        <p className="py-12 text-center text-muted-foreground">
          Opening your memories...
        </p>
      ) : isError ? (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            Something went wrong while loading your entries. Please try again.
          </CardContent>
        </Card>
      ) : entries.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <BookText className="h-10 w-10 text-primary" />
            <h2 className="font-serif text-xl font-semibold">
              No memories found yet
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your little memories will appear here once you write your first
              diary entry.
            </p>
            <Button asChild className="rounded-full">
              <Link to="/write">
                <PenLine className="mr-2 h-4 w-4" />
                Write an entry
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            {entries.length} {entries.length === 1 ? "memory" : "memories"} saved ♡
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <Link
                key={entry.id}
                to="/write"
                search={{ id: entry.id }}
                className="block"
              >
                <Card className="h-full rounded-3xl transition hover:-translate-y-1 hover:shadow-card">
                  <CardContent className="space-y-3 p-5">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(entry.entry_date)}
                      </span>
                      <span className="text-xl">
                        {moodInfo(entry.mood).emoji}
                      </span>
                    </div>

                    <h2 className="font-serif text-xl font-semibold">
                      {entry.title || "Untitled memory"}
                    </h2>

                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {entry.content}
                    </p>

                    <p className="pt-1 text-xs font-medium text-primary">
                      Read memory ♡
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
