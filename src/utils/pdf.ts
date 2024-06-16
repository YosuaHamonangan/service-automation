import { ServiceMode } from "@/constants";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker";
import { TextItem } from "pdfjs-dist/types/src/display/api";

interface LineItems {
  text: string;
  items: TextItem[];
  page: number;
  isFirstHalf: boolean;
}

const POS_TOLERANCE = 0.3;
const TOP_BOUND = /Acara(\ )?Kebaktian(\ )?Minggu/;
const BOT_BOUND = /Pelayan(\ )?Kebaktian(\ )?Minggu/;

const PATIK_FORMAT = /Hukum Taurat\ ?:?\ ?(.+)/;

const EPISTEL_FORMAT = /Epistel\ ?:?\ ?(.+)/;

const JAMITA_FORMAT = /Khotbah\ ?:?\ ?(.+)/;

export interface SongVerseData {
  songNum: string;
  verses: number[] | "all";
  standVerse?: number;
}

export interface ParsedPdfData {
  mode: ServiceMode;
  songs: SongVerseData[];
  patik: string;
  epistel: string;
  jamita: string;
}

export async function parsePdfData(
  pdfFile: File,
  mode: ServiceMode
): Promise<ParsedPdfData> {
  const loadingTask = getDocument(await pdfFile.arrayBuffer());
  const pdfDocument = await loadingTask.promise;

  let pdfData: LineItems[] = [];
  let curLineItems: LineItems = {
    text: "",
    items: [],
    page: 0,
    isFirstHalf: false,
  };
  let topBound: LineItems | undefined;
  let botBound: LineItems | undefined;
  for (let p = 1; p <= pdfDocument.numPages; p++) {
    const page = await pdfDocument.getPage(p);
    const textContent = await page.getTextContent();
    const pageWidth = page.getViewport().viewBox[2];

    textContent.items.forEach((item) => {
      if ("str" in item) {
        curLineItems.text += item.str;
        curLineItems.items.push(item);

        if (item.hasEOL) {
          if (curLineItems.text.match(TOP_BOUND)) {
            topBound = curLineItems;
          } else if (curLineItems.text.match(BOT_BOUND)) {
            botBound = curLineItems;
          }
          curLineItems.page = p;
          curLineItems.isFirstHalf = item.transform[4] < pageWidth / 2;
          pdfData.push(curLineItems);
          curLineItems = { text: "", items: [], page: 0, isFirstHalf: false };
        }
      }
    });
  }

  pdfData = pdfData.filter((lineItems) => {
    const y = lineItems.items[0].transform[5];
    return (
      y < topBound?.items[0].transform[5] &&
      y > botBound?.items[0].transform[5] &&
      lineItems.page === topBound?.page &&
      lineItems.isFirstHalf === topBound.isFirstHalf
    );
  });

  const votumText = "Votum";
  const votumItem: TextItem[] = [];
  pdfData[2].items.forEach((item) => {
    if (item.str.includes(votumText)) votumItem.push(item);
  });

  const leftBound = votumItem[0].transform[4] - POS_TOLERANCE;
  const rightBound = votumItem[1].transform[4];
  pdfData = pdfData.map((lineItems) => {
    const items = lineItems.items.filter((item) => {
      const x = item.transform[4];
      return x > leftBound && x < rightBound;
    });
    const text = items.reduce((val, { str }) => val + str, "");
    return { ...lineItems, items, text };
  });

  const lines = pdfData.map<string>(({ text }) => text);

  const songs = lines
    .filter((txt) => txt.startsWith("BN"))
    .map((text) => {
      text = text.replace(/ /g, "");
      const result = text.match(/BN\.No\.([0-9]+):([0-9\–\+du]+)(.+)?/);

      if (!result) throw "song format not matched";

      const songNum = result[1];
      const verseText = result[2];
      let verses: number[] | "all" = [];
      if (verseText.includes("du")) {
        verses = "all";
      } else if (verseText.includes("–")) {
        const [start, end] = verseText.split("–");
        for (let i = +start; i <= +end; i++) {
          verses.push(i);
        }
      } else if (verseText.includes("+")) {
        const list = verseText.split("+");
        // @ts-ignore
        list.forEach((txt) => verses.push(+txt));
      } else {
        verses.push(+verseText);
      }
      let standVerse = result[3]?.match(/ayat([0-9]+)berdiri/)?.[1];
      return {
        songNum,
        verses,
        standVerse: standVerse ? +standVerse : undefined,
      };
    });

  if (songs.length !== 7) throw Error("Song count doesn't match");

  const patik = lines[4]?.match(PATIK_FORMAT)?.[1];
  if (!patik) throw Error("Patik not found");
  const epistel = lines[8]?.match(EPISTEL_FORMAT)?.[1];
  if (!epistel) throw Error("Epistel not found");
  const jamita = lines[15]?.match(JAMITA_FORMAT)?.[1];
  if (!jamita) throw Error("Jamita not found");

  return {
    mode,
    songs,
    patik,
    epistel,
    jamita,
  };
}
