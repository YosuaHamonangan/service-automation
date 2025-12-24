import {
  ALKITAB_INFO,
  SERVICE_INFO,
  ServiceMode,
  SongSource,
} from "@/constants";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import "pdfjs-dist/legacy/build/pdf.worker";
import { RenderParameters, TextItem } from "pdfjs-dist/types/src/display/api";
import { closest } from "fastest-levenshtein";
import { PDFPageProxy } from "pdfjs-dist/types/web/interfaces";

const IMAGE_PDF_SCALING = 2;

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
const WARTA_TEXT = "WARTA UMUM";

const topBoundFilter = TOP_BOUND.trim().replaceAll(" ", "");
const botBoundFilter = BOT_BOUND.trim().replaceAll(" ", "");
const votumFilter = VOTUM_TEXT.trim().replaceAll(" ", "");
const wartaFilter = WARTA_TEXT.trim().replaceAll(" ", "");

export interface SongVerseData {
  source: SongSource;
  songNum: string;
  verses: number[] | "all";
  standVerse?: number;
}

export interface ResponsoriaTextData {
  title: string;
  text: string[];
}

export interface AlkitabInfo {
  book: string;
  chapter: string;
  verses: string; // e.g. 1,2,3,5
}

export interface ServiceData {
  mode: ServiceMode;
  songs: SongVerseData[];
  patik: string;
  epistel: string;
  epistelInfo: AlkitabInfo;
  jamita: string;
  jamitaInfo: AlkitabInfo;
  responsoriaText: ResponsoriaTextData[];
}

export type ServiceDataList = Partial<Record<ServiceMode, ServiceData>>;

export interface ParsedPdfData {
  serviceData: ServiceDataList;
  serviceTableImage: HTMLCanvasElement | undefined;
  wartaImages: HTMLCanvasElement[];
}

interface CropData {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PdfInitialSummary {
  pdfData: LineItems[];
  serviceTableData: {
    topBound?: LineItems;
    botBound?: LineItems;
    page?: PDFPageProxy;
  };
  wartaPage?: PDFPageProxy;
}

export async function parsePdfData(pdfFile: File): Promise<ParsedPdfData> {
  const pdfDocument = await getDocument(await pdfFile.arrayBuffer()).promise;

  const initialSummary: PdfInitialSummary = {
    pdfData: [],
    serviceTableData: {},
  };

  let curLineItems: LineItems = {
    text: "",
    items: [],
    page: 0,
    isFirstHalf: false,
  };
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
            initialSummary.serviceTableData.topBound = curLineItems;
            initialSummary.serviceTableData.page = page;
          } else if (normText.includes(botBoundFilter)) {
            initialSummary.serviceTableData.botBound = curLineItems;
          } else if (normText.includes(wartaFilter)) {
            initialSummary.wartaPage = page;
          }

          curLineItems.page = p;
          curLineItems.isFirstHalf = getX(curLineItems) < pageWidth / 2;
          initialSummary.pdfData.push(curLineItems);
          curLineItems = { text: "", items: [], page: 0, isFirstHalf: false };
        }
      }
    });
  }

  return {
    serviceData: parseServiceData(initialSummary),
    serviceTableImage: await getServiceTableImage(initialSummary),
    wartaImages: await getWartaImages(initialSummary),
  };
}

function parseServiceData(initialSummary: PdfInitialSummary): ServiceDataList {
  const { topBound, botBound } = initialSummary.serviceTableData;
  const pdfData = initialSummary.pdfData.filter((lineItems) => {
    const y = getY(lineItems);
    return (
      y < getY(topBound) &&
      y > getY(botBound) &&
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

  const result: ServiceDataList = {};
  Object.values(ServiceMode).forEach((mode) => {
    let leftBound = 0;
    let rightBound = 0;
    switch (mode) {
      case ServiceMode.INDO:
        if (votumItem.length === 1) {
          return;
        }

        leftBound = getX(votumItem[0]) - POS_TOLERANCE;
        rightBound = getX(votumItem[1]);
        break;

      case ServiceMode.BATAK:
        if (votumItem.length === 1) {
          leftBound = getX(votumItem[0]) - POS_TOLERANCE;
        } else {
          leftBound = getX(votumItem[1]) - POS_TOLERANCE;
        }

        rightBound = Infinity;
        break;

      default:
        const m: never = mode;
        break;
    }

    const lines = pdfData
      .map((lineItems) => {
        const items = lineItems.items.filter((item) => {
          const x = getX(item);
          return x > leftBound && x < rightBound;
        });
        const text = items.reduce((val, { str }) => val + str, "");
        return { ...lineItems, items, text };
      })
      .map<string>(({ text }) => text);

    const songs: SongVerseData[] = [];
    lines.forEach((text) => {
      text = text.replace(/ /g, "");
      const result = text.match(
        /(BE|BN|KJ|PKJ|NKB)\.?No\.?([0-9a-zA-Z]+):([0-9\–\+du]+)(.+)?/
      );

      if (!result) return;

      const source = result[1] as SongSource;
      const songNum = result[2];
      const verseText = result[3];
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
      let standVerse = result[4]?.match(
        new RegExp(SERVICE_INFO[mode].standFormat)
      )?.[1];
      songs.push({
        source,
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
      responsoriaText: [],
    };
  });

  return result;
}

async function getServiceTableImage(
  initialSummary: PdfInitialSummary
): Promise<HTMLCanvasElement | undefined> {
  const tablePage = initialSummary.serviceTableData.page;
  if (tablePage) {
    const pageCanvas = await drawPage(tablePage);
    const { width: pageWidth, height: pageHeight } = tablePage.getViewport({
      scale: 1,
    });
    const topLineHeight = getHeight(initialSummary.serviceTableData.topBound);

    const top =
      pageHeight -
      getY(initialSummary.serviceTableData.topBound) -
      topLineHeight;
    const bot =
      pageHeight -
      getY(initialSummary.serviceTableData.botBound) -
      topLineHeight;

    return await drawCroppedPage(pageCanvas, {
      x: pageWidth / 2,
      y: top,
      w: pageWidth / 2,
      h: bot - top,
    });
  }
}

async function getWartaImages(
  initialSummary: PdfInitialSummary
): Promise<HTMLCanvasElement[]> {
  const { wartaPage } = initialSummary;
  if (!wartaPage) return [];
  const pdfData = initialSummary.pdfData.filter((lineItems) => {
    return lineItems.page === wartaPage.pageNumber;
  });

  const { width: pageWidth, height: pageHeight } = wartaPage.getViewport({
    scale: 1,
  });
  const tolerance = pageWidth / 200; // around 1 char
  const pageMidY = pageHeight / 2;

  let firstHalfMinX = Infinity;
  let secondHalfMinX = Infinity;
  pdfData.forEach((lineItems) => {
    const x = getX(lineItems);
    if (lineItems.isFirstHalf && x < firstHalfMinX) {
      firstHalfMinX = x;
    } else if (!lineItems.isFirstHalf && x < secondHalfMinX) {
      secondHalfMinX = x;
    }
  });
  firstHalfMinX += tolerance;
  secondHalfMinX += tolerance;

  const subHeaders = pdfData.filter((lineItems) => {
    const x = getX(lineItems);
    return (
      (lineItems.isFirstHalf && x < firstHalfMinX) ||
      (!lineItems.isFirstHalf && x < secondHalfMinX)
    );
  });

  let firstHalfMidY = 0;
  let secondHalfMidY = 0;
  subHeaders.forEach((lineItems) => {
    const height = getHeight(lineItems);
    const y = pageHeight - getY(lineItems) - height;
    if (
      lineItems.isFirstHalf &&
      Math.abs(y - pageMidY) < Math.abs(firstHalfMidY - pageMidY)
    ) {
      firstHalfMidY = y;
    } else if (
      !lineItems.isFirstHalf &&
      Math.abs(y - pageMidY) < Math.abs(secondHalfMidY - pageMidY)
    ) {
      secondHalfMidY = y;
    }
  });

  const pageCanvas = await drawPage(wartaPage);

  return await Promise.all([
    drawCroppedPage(pageCanvas, {
      x: 0,
      y: 0,
      w: pageWidth / 2,
      h: firstHalfMidY,
    }),
    drawCroppedPage(pageCanvas, {
      x: 0,
      y: firstHalfMidY,
      w: pageWidth / 2,
      h: pageHeight - firstHalfMidY,
    }),
    drawCroppedPage(pageCanvas, {
      x: pageWidth / 2,
      y: 0,
      w: pageWidth / 2,
      h: secondHalfMidY,
    }),
    drawCroppedPage(pageCanvas, {
      x: pageWidth / 2,
      y: secondHalfMidY,
      w: pageWidth / 2,
      h: pageHeight - secondHalfMidY,
    }),
  ]);
}

function getAlkitabInfo(text: string, mode: ServiceMode): AlkitabInfo {
  const textNoSpace = text.replaceAll(" ", "");
  const parts = textNoSpace.match(/(.+?)([0-9]+):(.+)/);
  if (!parts) return { book: "0", chapter: "1", verses: "1" };

  const books = ALKITAB_INFO[mode];
  const booksWithoutSpace = books.map((book) => book.replaceAll(" ", ""));
  const bookWithoutSpace = closest(parts[1], booksWithoutSpace);
  const index = booksWithoutSpace.indexOf(bookWithoutSpace);
  const book = books[index];

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

async function drawPage(page: PDFPageProxy): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale: IMAGE_PDF_SCALING });
  const canvas = document.createElement("canvas");
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const renderContext: RenderParameters = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext).promise;
  }
  return canvas;
}

async function drawCroppedPage(
  pageCanvas: HTMLCanvasElement,
  crop: CropData
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.height = crop.h * IMAGE_PDF_SCALING;
  canvas.width = crop.w * IMAGE_PDF_SCALING;

  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.drawImage(
      pageCanvas,
      crop.x * IMAGE_PDF_SCALING,
      crop.y * IMAGE_PDF_SCALING,
      crop.w * IMAGE_PDF_SCALING,
      crop.h * IMAGE_PDF_SCALING,
      0,
      0,
      crop.w * IMAGE_PDF_SCALING,
      crop.h * IMAGE_PDF_SCALING
    );
    // document.body.appendChild(canvas);
  }
  return canvas;
}

function getX(item: LineItems | TextItem | undefined): number {
  if (!item) return 0;
  if ("items" in item) {
    item = item.items[0];
  }
  return item.transform[4] ?? 0;
}

function getY(item: LineItems | TextItem | undefined): number {
  if (!item) return 0;
  if ("items" in item) {
    item = item.items[0];
  }
  return item.transform[5] ?? 0;
}

function getHeight(item: LineItems | TextItem | undefined): number {
  if (!item) return 0;
  if ("items" in item) {
    item = item.items[0];
  }
  return item.height;
}
