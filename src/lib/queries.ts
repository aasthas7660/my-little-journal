import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DiaryEntry, Letter, Profile } from "./diary";

export interface EntryFilters {
  search?: string;
  mood?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export function entriesQuery(filters: EntryFilters = {}) {
  return queryOptions({
    queryKey: ["diary-entries", filters],
    queryFn: async (): Promise<DiaryEntry[]> => {
      let q = supabase
        .from("diary_entries")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (filters.search) {
        q = q.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      if (filters.mood) q = q.eq("mood", filters.mood);
      if (filters.from) q = q.gte("entry_date", filters.from);
      if (filters.to) q = q.lte("entry_date", filters.to);
      if (filters.limit) q = q.limit(filters.limit);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function entryQuery(id: string) {
  return queryOptions({
    queryKey: ["diary-entry", id],
    queryFn: async (): Promise<DiaryEntry> => {
      const { data, error } = await supabase
        .from("diary_entries")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This diary entry could not be found.");
      return data;
    },
  });
}

export function lettersQuery() {
  return queryOptions({
    queryKey: ["letters"],
    queryFn: async (): Promise<Letter[]> => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .order("letter_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function letterQuery(id: string) {
  return queryOptions({
    queryKey: ["letter", id],
    queryFn: async (): Promise<Letter> => {
      const { data, error } = await supabase
        .from("letters")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("This letter could not be found.");
      return data;
    },
  });
}

export function profileQuery() {
  return queryOptions({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile> => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

/** The signed-in user, or null when signed out. */
export function currentUserQuery() {
  return queryOptions({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}
