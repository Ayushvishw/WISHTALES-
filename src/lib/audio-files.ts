/**
 * Rules for a customer's own song. Vercel caps request and response bodies at
 * 4.5 MB, so songs must stay under 4 MB (about 4 minutes of a typical MP3).
 */
export const SONG_RULES = {
  maxBytes: 4 * 1024 * 1024,
  accept: "audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/aac,audio/ogg,audio/wav,.mp3,.m4a,.aac,.ogg,.wav",
};

export const CUSTOM_MUSIC_ID = "mus_custom";

export type SongFormat = { ext: "mp3" | "m4a" | "aac" | "ogg" | "wav"; contentType: string };

/** Identifies the audio format from the file's bytes, never from its name or declared type. */
export function sniffAudio(b: Buffer): SongFormat | null {
  if (b.length < 12) return null;
  const ascii = (start: number, end: number) => b.subarray(start, end).toString("latin1");
  if (ascii(0, 3) === "ID3") return { ext: "mp3", contentType: "audio/mpeg" };
  // MPEG audio frame sync: 11 set bits, layer III (MP3).
  if (b[0] === 0xff && (b[1] & 0xe0) === 0xe0 && (b[1] & 0x06) === 0x02) return { ext: "mp3", contentType: "audio/mpeg" };
  // ADTS AAC: 12 set bits, layer 00.
  if (b[0] === 0xff && (b[1] & 0xf6) === 0xf0) return { ext: "aac", contentType: "audio/aac" };
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (["M4A ", "M4B ", "mp42", "isom", "iso2", "mp41", "dash"].includes(brand)) return { ext: "m4a", contentType: "audio/mp4" };
    return null;
  }
  if (ascii(0, 4) === "OggS") return { ext: "ogg", contentType: "audio/ogg" };
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WAVE") return { ext: "wav", contentType: "audio/wav" };
  return null;
}

/** Content type for a stored media key, by its extension. */
export function mediaContentType(key: string): string {
  const ext = key.slice(key.lastIndexOf(".") + 1);
  return (
    { webp: "image/webp", mp3: "audio/mpeg", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", wav: "audio/wav" } as Record<string, string>
  )[ext] ?? "application/octet-stream";
}

/** Makes a customer's file name safe and short for display. Never used as a storage key. */
export function songTitle(name: string): string {
  const base = name.replace(/\.[A-Za-z0-9]{2,4}$/, "").replace(/[_]+/g, " ");
  const clean = base.replace(/[^\p{L}\p{N}\s'&().,-]/gu, "").replace(/\s+/g, " ").trim();
  return clean.slice(0, 80) || "Your song";
}
