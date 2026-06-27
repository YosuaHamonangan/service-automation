import { ALKITAB_INFO, ServiceMode } from "@/constants";
import { loadAlkitabDb } from "./db";
import { AlkitabInfo } from "./pdf";

export async function getAlkitabText(mode: ServiceMode, info: AlkitabInfo) {
    const { book, chapter, verses } = info;
    const db = await loadAlkitabDb(mode, ALKITAB_INFO[mode].indexOf(book) + 1);
    const verseList = db[+chapter - 1].map((str) => {
        const result = str.match(/.+:([0-9]+)([a-z]?) /);
        const verse = result?.[1] ?? "";
        const subverse = result?.[2];
        return { str, verse, subverse };
    });

    const result: string[] = [];
    verses.split(",").forEach((v) => {
        const matchedVerses = verseList.filter(({ verse }) => verse === v);
        if (!matchedVerses) return;

        matchedVerses.forEach(({ str }) => {
            result.push(str);
        });
    });
    return result;
}
