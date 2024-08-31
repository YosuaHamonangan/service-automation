import { ALKITAB_INFO, SERVICE_INFO, ServiceMode } from "@/constants";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import { closest } from "fastest-levenshtein";

interface LineItems {
  text: string;
  items: TextItem[];
  page: number;
  isFirstHalf: boolean;
}

const POS_TOLERANCE = 0.3;
const TOP_BOUND = "Acara Kebaktian Minggu";
const BOT_BOUND = "Pelayan Kebaktian Minggu";
const VOTUM_TEXT = "Votum";

export interface SongVerseData {
  songNum: string;
  verses: number[] | "all";
  standVerse?: number;
}

export interface AlkitabInfo {
  book: string;
  chapter: string;
  verses: string;
}

export interface ServiceData {
  mode: ServiceMode;
  songs: SongVerseData[];
  patik: string;
  epistel: string;
  epistelInfo: AlkitabInfo;
  jamita: string;
  jamitaInfo: AlkitabInfo;
}

export type ParsedPdfData = Record<ServiceMode, ServiceData>;

export async function parsePdfData(pdfFile: File): Promise<ParsedPdfData> {
  const loadingTask = getDocument(await pdfFile.arrayBuffer());
  const pdfDocument = await loadingTask.promise;

  const topBoundFilter = TOP_BOUND.trim().replaceAll(" ", "");
  const botBoundFilter = BOT_BOUND.trim().replaceAll(" ", "");
  const votumFilter = VOTUM_TEXT.trim().replaceAll(" ", "");

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
          const normText = curLineItems.text.trim().replaceAll(" ", "");
          if (normText.includes(topBoundFilter)) {
            topBound = curLineItems;
          } else if (normText.includes(botBoundFilter)) {
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

  const votumItem: TextItem[] = [];
  pdfData
    .find((data) => {
      const normText = data.text.replaceAll(" ", "");
      return normText.includes(votumFilter);
    })
    ?.items.forEach((item) => {
      const normText = item.str.trim().replaceAll(" ", "");
      if (normText.includes(votumFilter)) votumItem.push(item);
    });

  const result: ParsedPdfData = {} as any;
  Object.values(ServiceMode).forEach((mode) => {
    let leftBound = 0;
    let rightBound = 0;
    switch (mode) {
      case ServiceMode.INDO:
        leftBound = votumItem[0].transform[4] - POS_TOLERANCE;
        rightBound = votumItem[1].transform[4];
        break;

      case ServiceMode.BATAK:
        leftBound = votumItem[1].transform[4] - POS_TOLERANCE;
        rightBound = Infinity;
        break;

      default:
        const m: never = mode;
        break;
    }

    const lines = pdfData
      .map((lineItems) => {
        const items = lineItems.items.filter((item) => {
          const x = item.transform[4];
          return x > leftBound && x < rightBound;
        });
        const text = items.reduce((val, { str }) => val + str, "");
        return { ...lineItems, items, text };
      })
      .map<string>(({ text }) => text);

    const songs: SongVerseData[] = [];
    lines
      .filter((txt) => txt.startsWith(mode))
      .forEach((text) => {
        text = text.replace(/ /g, "");
        const result = text.match(/B[NE]\.No\.([0-9]+):([0-9\–\+du]+)(.+)?/);

        if (!result) return;

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
        let standVerse = result[3]?.match(
          new RegExp(SERVICE_INFO[mode].standFormat)
        )?.[1];
        songs.push({
          songNum,
          verses,
          standVerse: standVerse ? +standVerse : undefined,
        });
      });

    const patik =
      lines
        .find((str) => str.match(new RegExp(SERVICE_INFO[mode].patikFormat)))
        ?.match(new RegExp(SERVICE_INFO[mode].patikFormat))?.[1] ?? "";

    const epistel =
      lines
        .find((str) => str.match(new RegExp(SERVICE_INFO[mode].epistelFormat)))
        ?.match(new RegExp(SERVICE_INFO[mode].epistelFormat))?.[1] ?? "";

    const jamita =
      lines
        .find((str) => str.match(new RegExp(SERVICE_INFO[mode].jamitaFormat)))
        ?.match(new RegExp(SERVICE_INFO[mode].jamitaFormat))?.[1] ?? "";

    result[mode] = {
      mode,
      songs,
      patik,
      epistel,
      epistelInfo: getAlkitabInfo(epistel, mode),
      jamita,
      jamitaInfo: getAlkitabInfo(jamita, mode),
    };
  });
  return result;
}

function getAlkitabInfo(text: string, mode: ServiceMode): AlkitabInfo {
  const textNoSpace = text.replaceAll(" ", "");
  const parts = textNoSpace.match(/(.+?)([0-9]+):(.+)/);
  if (!parts) return { book: "0", chapter: "1", verses: "1" };

  const books = ALKITAB_INFO[mode];
  const book = closest(parts[1], books);
  const chapter = parts[2];
  const verses = [];
  const [start, end] = parts[3].split("–");
  for (let i = +start; i <= +end; i++) {
    verses.push(i);
  }

  return {
    book,
    chapter,
    verses: verses.join(","),
  };
}
