
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";

import { entriesQuery } from "@/lib/queries";
import { formatShortDate } from "@/lib/diary";
import { moodInfo } from "@/lib/moods";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/calendar")({
  component: CalendarPage,
});

function CalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState("");

  const { data: entries = [], isLoading, isError } = useQuery(
    entriesQuery(),
  );

  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const monthName = month.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const firstDay = new Date(year, monthIndex, 1).getDay();

  const entriesByDate = useMemo(() => {
    const grouped: Record<string, typeof entries> = {};

    entries.forEach((entry) => {
      grouped[entry.entry_date] ??= [];
      grouped[entry.entry_date].push(entry);
    });

    return grouped;
  }, [entries]);

  const selectedEntries = selectedDate
    ? entriesByDate[selectedDate] ?? []
    : [];

  function changeMonth(direction: number) {
    setMonth(new Date(year, monthIndex + direction, 1));
    setSelectedDate("");
  }

  function dateKey(day: number) {
    return `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm text-primary">A little timeline of your life ♡</p>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          My Memory Calendar
        </h1>
        <p className="text-muted-foreground">
          See the days you've filled with memories.
        </p>
      </section>

        <Card className="mx-auto max-w-2xl rounded-3xl border-border/60 shadow-sm">        <CardContent className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => changeMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>

            <h2 className="font-serif text-xl font-semibold">
              {monthName}
            </h2>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => changeMonth(1)}
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="py-2 text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}

            {Array.from({ length: firstDay }).map((_, index) => (
              <div key={`empty-${index}`} />
            ))}

            {Array.from({ length: daysInMonth }, (_, index) => index + 1).map(
              (day) => {
                const key = dateKey(day);
                const hasEntry = Boolean(entriesByDate[key]?.length);
                const isSelected = selectedDate === key;
                const isToday =
                  key === new Date().toLocaleDateString("en-CA");

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDate(key)}
                    className={`relative mx-auto flex h-12 w-full max-w-14 flex-col items-center justify-center rounded-2xl text-sm transition hover:bg-secondary ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isToday
                          ? "bg-secondary font-semibold"
                          : "text-foreground"
                    }`}
                  >
                    {day}
                    {hasEntry && (
                        <span
                            className={`absolute bottom-1 text-[10px] leading-none ${
                                isSelected
                                    ? "text-primary-foreground"
                                    : "text-primary"
                            }`}
                        >
                            ✿
                        </span>
            )}
                  </button>
                );
              },
            )}
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Days with diary entries
          </div>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">
          {selectedDate
            ? `Memories from ${formatShortDate(selectedDate)}`
            : "Choose a day to explore"}
        </h2>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading your memories...</p>
        ) : isError ? (
          <p className="text-sm text-muted-foreground">
            We couldn't load your memories. Please try again.
          </p>
        ) : !selectedDate ? (
          <p className="text-sm text-muted-foreground">
            Tap any date on the calendar to see what you wrote that day.
          </p>
        ) : selectedEntries.length === 0 ? (
          <Card className="rounded-3xl border-dashed">
            <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
              <CalendarDays className="h-8 w-8 text-primary" />
              <p className="font-serif text-lg">A quiet little day ♡</p>
              <p className="text-sm text-muted-foreground">
                No diary entries were saved on this date.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {selectedEntries.map((entry) => (
              <Link
                key={entry.id}
                to="/write"
                search={{ id: entry.id }}
              >
                <Card className="rounded-2xl transition hover:shadow-card">
                  <CardContent className="flex items-center gap-4 p-4">
                    <span className="text-2xl">
                      {moodInfo(entry.mood).emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif font-semibold">
                        {entry.title || "Untitled memory"}
                      </h3>
                      <p className="line-clamp-1 text-sm text-muted-foreground">
                        {entry.content}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
