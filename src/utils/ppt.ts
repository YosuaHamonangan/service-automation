import { ALKITAB_INFO, ServiceMode } from "@/constants";
import { loadAlkitabDb } from "./db";
import { ServiceData } from "./pdf";

export async function createServicePPT(serviceData: ServiceData) {
  const jamita = await getAlkitabtext(serviceData.mode, serviceData.jamitaCode);
  console.log(jamita);
  return;
}

async function getAlkitabtext(mode: ServiceMode, code: string) {
  const [book, chapter, verses] = code.split("-");
  const db = await loadAlkitabDb(mode, ALKITAB_INFO[mode].indexOf(book) + 1);
  const chapterText = db[+chapter - 1];

  const result: string[] = [];
  verses.split(",").forEach((v) => {
    const verse = chapterText[+v - 1];
    if (!verse) return;

    result.push(`${chapter}:${v} ${verse}`);
  });
  return result.join("\n");
}
