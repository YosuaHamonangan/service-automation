import { SERVICE_INFO, ServiceMode, SONG_INFO, SongSource } from "@/constants";
import { SongDb } from "@/types";

export async function loadSongDb(source: SongSource): Promise<SongDb> {
  const res = await fetch(SONG_INFO[source].songDb);
  const result = await res.text();
  return JSON.parse(result);
}

export async function loadAlkitabDb(
  mode: ServiceMode,
  book: number
): Promise<string[][]> {
  const res = await fetch(`${SERVICE_INFO[mode].alkitabDb}${book}.json`);
  const result = await res.text();
  return JSON.parse(result);
}
