import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type DiaryEntry = Database["public"]["Tables"]["diary_entries"]["Row"];
export type DiaryEntryInsert = Database["public"]["Tables"]["diary_entries"]["Insert"];
export type Letter = Database["public"]["Tables"]["letters"]["Row"];
export type LetterInsert = Database["public"]["Tables"]["letters"]["Insert"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/** Today's date as YYYY-MM-DD in the visitor's own timezone. */
export function todayISO(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function formatEntryDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const QUOTES = [
  "Fill your paper with the breathings of your heart. — William Wordsworth",
  "How we spend our days is, of course, how we spend our lives. — Annie Dillard",
  "Write it on your heart that every day is the best day of the year. — Ralph Waldo Emerson",
  "There is no greater agony than bearing an untold story inside you. — Maya Angelou",
  "Little by little, one travels far. — J.R.R. Tolkien",
  "Bloom where you are planted.",
  "You are allowed to be both a masterpiece and a work in progress.",
  "Some days are simply made for softness.",
  "Yesterday is gone. Tomorrow has not yet come. We have only today — let us begin. — Mother Teresa",
  "Whatever you do, do it with all your heart.",
  "The privilege of a lifetime is to become who you truly are. — Carl Jung",
  "Perhaps this is the moment for which you have been created. — Esther 4:14",
];

/** A gentle quote that changes each day. */
export function quoteOfTheDay(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 0);
  const day = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  return QUOTES[day % QUOTES.length] ?? QUOTES[0]!;
}

/** Signed, private URL for a diary photo (paths stay user-scoped). */
export async function photoSignedUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage
    .from("diary-photos")
    .createSignedUrl(path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Upload a diary photo into the signed-in user's private folder. */
export async function uploadDiaryPhoto(userId: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80) || "photo.jpg";
  const path = `${userId}/${Date.now()}-${safeName}`;
  const { error } = await supabase.storage
    .from("diary-photos")
    .upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  return path;
}

/** Remove a diary photo this user owns. */
export async function deleteDiaryPhoto(path: string | null): Promise<void> {
  if (!path) return;
  const { error } = await supabase.storage.from("diary-photos").remove([path]);
  if (error) throw error;
}
