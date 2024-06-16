import { SERVICE_INFO, ServiceMode } from "@/constants";
import { SongDb } from "@/types";

function getDbKey(mode: ServiceMode): string {
  return `SONG_DB_${mode}`;
}

export async function loadSongDb(mode: ServiceMode): Promise<SongDb> {
  const key = getDbKey(mode);
  let result = localStorage.getItem(key);
  if (!result) {
    const res = await fetch(SERVICE_INFO[mode].db);
    result = await res.text();
    localStorage.setItem(key, result);
  }
  return JSON.parse(result);
}
