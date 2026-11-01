import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Loader2, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  deleteDiaryPhoto,
  todayISO,
  uploadDiaryPhoto,
} from "@/lib/diary";
import { entryQuery } from "@/lib/queries";
import { MOODS } from "@/lib/moods";
import { PROMPTS } from "@/lib/prompts";
import { PhotoThumb } from "@/components/photo-thumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { pageHead } from "@/lib/head";

export const Route = createFileRoute("/_authenticated/write")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: typeof search.id === "string" && search.id ? search.id : undefined,
    date:
      typeof search.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
        ? search.date
        : undefined,
  }),
  head: () =>
    pageHead(
      "Today's entry — My Little Journal ♡",
      "Write today's diary page: pick a mood, follow a gentle prompt, and tuck in a photo.",
    ),
  component: WritePage,
});

function WritePage() {
  const { id, date } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const editing = Boolean(id);
  const { data: existing } = useQuery({ ...entryQuery(id ?? ""), enabled: editing });

  const [entryDate, setEntryDate] = useState(date ?? todayISO());
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [mood, setMood] = useState<string>("calm");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [existingPhoto, setExistingPhoto] = useState<string | null>(null);
  const [photoTouched, setPhotoTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Load an existing entry into the form exactly once.
  useEffect(() => {
    if (!editing || !existing || loadedId === existing.id) return;
    setLoadedId(existing.id);
    setEntryDate(existing.entry_date);
    setTitle(existing.title);
    setContent(existing.content);
    setMood(existing.mood);
    setExistingPhoto(existing.photo_url);
  }, [editing, existing, loadedId]);

  // Revoke object URLs when they are replaced.
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoTouched(true);
  }

  function clearPhoto() {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoTouched(true);
  }

  async function handleSave() {
    if (!content.trim() && !title.trim()) {
      toast.error("Write a little something first ♡");
      return;
    }
    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("You are signed out — please sign in again.");

      let photoPath = existingPhoto;
      if (photoFile) {
        if (existingPhoto) await deleteDiaryPhoto(existingPhoto);
        photoPath = await uploadDiaryPhoto(userId, photoFile);
      } else if (photoTouched && existingPhoto) {
        await deleteDiaryPhoto(existingPhoto);
        photoPath = null;
      }

      const row = {
        user_id: userId,
        entry_date: entryDate,
        title: title.trim() || "Untitled entry",
        content: content.trim(),
        mood,
        photo_url: photoPath,
      };

      const { error } = editing
        ? await supabase.from("diary_entries").update(row).eq("id", id!)
        : await supabase.from("diary_entries").insert(row);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      if (editing) queryClient.invalidateQueries({ queryKey: ["diary-entry", id] });
      toast.success(editing ? "Your entry has been updated ♡" : "Your entry is saved ♡");
      navigate({ to: "/archive" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      if (existingPhoto) await deleteDiaryPhoto(existingPhoto);
      const { error } = await supabase.from("diary_entries").delete().eq("id", id!);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["diary-entries"] });
      toast.success("Entry deleted.");
      navigate({ to: "/archive" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong while deleting.");
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-6">
        <h1 className="font-serif text-3xl font-semibold md:text-4xl">
          {editing ? "Edit your entry" : "Today's page"}{" "}
          <span className="text-soft-purple">♡</span>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a mood, write freely — and add a photo if you'd like.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <Card className="rounded-3xl border-border/60 shadow-card">
          <CardContent className="space-y-5 p-5 md:p-7">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="entry-date">Date</Label>
                <Input
                  id="entry-date"
                  type="date"
                  value={entryDate}
                  max={todayISO()}
                  onChange={(e) => setEntryDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="entry-title">Heading</Label>
                <Input
                  id="entry-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="A little headline for today…"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mood</Label>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {MOODS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setMood(m.value)}
                    aria-pressed={mood === m.value}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-2xl border px-1 py-2.5 transition-colors",
                      mood === m.value
                        ? "border-soft-purple bg-secondary shadow-card"
                        : "border-border/60 bg-card hover:bg-muted",
                    )}
                  >
                    <span className="text-2xl">{m.emoji}</span>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {m.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="entry-content">Your entry</Label>
              <Textarea
                id="entry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Dear journal…"
                className="panel-paper min-h-56 resize-y rounded-2xl"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={handleSave} disabled={saving} className="rounded-full">
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <span className="mr-1">♡</span>
                )}
                {editing ? "Save changes" : "Save entry"}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => navigate({ to: "/archive" })}
              >
                Cancel
              </Button>

              {editing && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="ml-auto rounded-full text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete entry
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This page and its photo will be gone for good. There's no undo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="rounded-full">Keep it</AlertDialogCancel>
                      <AlertDialogAction
                        className="rounded-full"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDelete();
                        }}
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-3xl border-border/60 shadow-card">
            <CardContent className="p-5">
              <Label>Photo</Label>
              {photoPreview ? (
                <div className="relative mt-3">
                  <img
                    src={photoPreview}
                    alt="New photo"
                    className="h-40 w-full rounded-2xl object-cover"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={clearPhoto}
                    aria-label="Remove photo"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : existingPhoto && !photoTouched ? (
                <div className="relative mt-3">
                  <PhotoThumb
                    path={existingPhoto}
                    alt="Current photo"
                    className="h-40 w-full rounded-2xl"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={clearPhoto}
                    aria-label="Remove photo"
                    className="absolute right-2 top-2 h-8 w-8 rounded-full"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label className="mt-3 flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/40 text-center transition-colors hover:bg-secondary/70">
                  <ImagePlus className="h-6 w-6 text-soft-purple" />
                  <span className="text-xs font-medium text-muted-foreground">
                    Add a photo to this page
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => pickPhoto(e.target.files?.[0])}
                  />
                </label>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60 shadow-card">
            <CardContent className="p-5">
              <Label>Need a little spark?</Label>
              <div className="mt-3 flex flex-col gap-2">
                {PROMPTS.map((p) => (
                  <button
                    key={p.text}
                    type="button"
                    onClick={() =>
                      setContent((c) => (c.trim() ? `${c}\n\n${p.text} ` : `${p.text} `))
                    }
                    className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    <span>{p.icon}</span>
                    {p.text}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
