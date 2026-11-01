
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, Mail, Plus, Trash2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { lettersQuery } from "@/lib/queries";
import { formatShortDate } from "@/lib/diary";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/letters")({
  component: LettersPage,
});

function LettersPage() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    data: letters = [],
    isLoading,
    isError,
  } = useQuery(lettersQuery());

  const saveLetter = useMutation({
    mutationFn: async () => {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) throw userError;
      if (!userData.user) throw new Error("Please sign in first.");

      const { error } = await supabase.from("letters").insert({
        user_id: userData.user.id,
        title: title.trim(),
        content: content.trim(),
        letter_date: new Date().toLocaleDateString("en-CA"),
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["letters"] });
      setTitle("");
      setContent("");
      setShowForm(false);
      setErrorMessage("");
    },
    onError: (error) => {
      setErrorMessage(error.message || "Could not save your letter.");
    },
  });

  const deleteLetter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("letters")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["letters"] });
    },
    onError: (error) => {
      setErrorMessage(error.message || "Could not delete your letter.");
    },
  });

  function handleSave() {
    setErrorMessage("");

    if (!title.trim() || !content.trim()) {
      setErrorMessage("Please add both a title and your letter.");
      return;
    }

    saveLetter.mutate();
  }

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <p className="text-sm text-primary">Words from your heart ♡</p>
        <h1 className="font-serif text-3xl font-semibold sm:text-4xl">
          Letters to Myself
        </h1>
        <p className="text-muted-foreground">
          Little notes, big feelings, and everything in between.
        </p>
      </section>

      <div className="flex justify-end">
        <Button
          className="rounded-full"
          onClick={() => {
            setErrorMessage("");
            setShowForm(!showForm);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Write a letter
        </Button>
      </div>

      {showForm && (
        <Card className="rounded-3xl">
          <CardContent className="space-y-4 p-5 sm:p-7">
            <h2 className="font-serif text-xl font-semibold">
              A letter from my heart ♡
            </h2>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Give your letter a title..."
              className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            />

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Dear me..."
              rows={7}
              className="w-full resize-y rounded-2xl border border-border bg-background p-4 text-sm leading-7 outline-none focus:ring-2 focus:ring-primary/30"
            />

            {errorMessage && (
              <p className="text-sm text-destructive">{errorMessage}</p>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setShowForm(false);
                  setTitle("");
                  setContent("");
                  setErrorMessage("");
                }}
              >
                Cancel
              </Button>

              <Button
                className="rounded-full"
                onClick={handleSave}
                disabled={saveLetter.isPending}
              >
                <Heart className="mr-2 h-4 w-4" />
                {saveLetter.isPending ? "Saving..." : "Save my letter"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="py-10 text-center text-muted-foreground">
          Opening your letters...
        </p>
      ) : isError ? (
        <Card className="rounded-3xl">
          <CardContent className="p-8 text-center text-muted-foreground">
            We couldn't load your letters. Please try again.
          </CardContent>
        </Card>
      ) : letters.length === 0 ? (
        <Card className="rounded-3xl border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
            <Mail className="h-10 w-10 text-primary" />
            <h2 className="font-serif text-xl font-semibold">
              Your letter box is waiting ♡
            </h2>
            <p className="max-w-sm text-sm text-muted-foreground">
              Write your first letter. It can be a promise, a dream, or
              something you want to tell your future self.
            </p>
            <Button
              className="rounded-full"
              onClick={() => setShowForm(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Write my first letter
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {letters.map((letter) => (
            <Card key={letter.id} className="rounded-3xl">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatShortDate(letter.letter_date)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive"
                    aria-label="Delete letter"
                    disabled={deleteLetter.isPending}
                    onClick={() => {
                      if (window.confirm("Are you sure you want to delete this letter?")) {
                        deleteLetter.mutate(letter.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <h2 className="font-serif text-xl font-semibold">
                  {letter.title}
                </h2>

                <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {letter.content}
                </p>

                <div className="flex justify-end">
                  <Heart className="h-4 w-4 text-primary" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {errorMessage && !showForm && (
        <p className="text-sm text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
