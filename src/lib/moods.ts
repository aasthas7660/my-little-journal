
export const MOODS = [
  { value: "happy", emoji: "🌞", label: "Happy" },
  { value: "calm", emoji: "☁️", label: "Calm" },
  { value: "loved", emoji: "♡", label: "Loved" },
  { value: "excited", emoji: "✨", label: "Excited" },
  { value: "tired", emoji: "🌙", label: "Tired" },
  { value: "sad", emoji: "🌧️", label: "Sad" },
  { value: "anxious", emoji: "🦋", label: "Anxious" },
  { value: "grateful", emoji: "🌷", label: "Grateful" },
] as const;

export type MoodValue = (typeof MOODS)[number]["value"];

export function moodInfo(value: string): (typeof MOODS)[number] {
  return MOODS.find((m) => m.value === value) ?? MOODS[1];
}
