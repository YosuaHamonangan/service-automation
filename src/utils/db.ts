import { SERVICE_INFO, ServiceMode } from "@/constants";
import { SongDb } from "@/types";

export async function loadSongDb(mode: ServiceMode): Promise<SongDb> {
  const res = await fetch(SERVICE_INFO[mode].songDb);
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
