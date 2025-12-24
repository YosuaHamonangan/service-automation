import { ALKITAB_INFO, ServiceMode } from "@/constants";
import { loadAlkitabDb } from "./db";
import { AlkitabInfo, ParsedPdfData } from "./pdf";
import PptxGenJS from "pptxgenjs";

const isSquareLayout = false;

export async function createServicePPT(
  pdfData: ParsedPdfData,
  mode: ServiceMode
) {
  const serviceData = pdfData.serviceData[mode];
  if (!serviceData) {
    return;
  }

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "HKBP", width: 13.333, height: 7.5 });
  pptx.layout = isSquareLayout ? "LAYOUT_4x3" : "HKBP";

  if (pdfData.serviceTableImage) {
    addImageSlide(pptx, pdfData.serviceTableImage);
  }

  const epistel = await getAlkitabtext(
    serviceData.mode,
    serviceData.epistelInfo
  );
  epistel.forEach((content) => {
    addTextSlide(pptx, serviceData.epistel, content);
  });

  pdfData.wartaImages.forEach((image) => {
    addImageSlide(pptx, image);
  });

  serviceData.responsoriaText.forEach((responsoria) => {
    responsoria.text.forEach((text) => {
      addTextSlide(pptx, responsoria.title, text);
    });
  });

  const jamita = await getAlkitabtext(serviceData.mode, serviceData.jamitaInfo);
  jamita.forEach((content) => {
    addTextSlide(pptx, serviceData.jamita, content);
  });

  return (await pptx.write({ outputType: "blob" })) as Blob;
}

// const LIMIT = 250;
// const data2: { title: string; content: string }[] = [];
// data.forEach(({ title, content }) => {
//   const contents: string[] = [];
//   let i = 0;
//   content.split(".").forEach((str) => {
//     if (contents[i] === undefined) {
//       contents[i] = str + ".";
//       return;
//     }

//     const newContent = contents[i] + str;
//     if (newContent.length < LIMIT) {
//       contents[i] = newContent;
//     } else {
//       i++;
//       contents[i] = str;
//     }
//   });
//   contents.forEach((str) => {
//     data2.push({ title, content: str });
//   });
// });

function addTextSlide(pptx: PptxGenJS, title: string, content: string) {
  const slide = pptx.addSlide();

  slide.addImage({
    path: "images/logo-hkbp.png",
    x: 0,
    y: 0.17,
    w: 2.05,
    h: 1.54,
  });
  slide.addText(title, {
    x: 1.85,
    y: 0.5,
    w: isSquareLayout ? 7.36 : 10.69,
    h: 0.71,
    bold: true,
    fontSize: isSquareLayout ? 36 : 45,
    fontFace: "Arial",
  });

  slide.addText(content, {
    x: 0.68,
    y: 1.84,
    w: isSquareLayout ? 8.64 : 11.97,
    h: 1.84,
    fontSize: isSquareLayout ? 36 : 50,
    fontFace: "Arial",
    valign: "top",
    autoFit: true,
  });
}

function addImageSlide(pptx: PptxGenJS, canvas: HTMLCanvasElement) {
  const slide = pptx.addSlide();

  slide.addImage({
    data: canvas.toDataURL(),
    x: "5%",
    y: "2%",
    w: canvas.width,
    h: canvas.height,
    sizing: {
      type: "contain",
      w: "90%",
      h: "96%",
    },
  });
}

async function getAlkitabtext(mode: ServiceMode, info: AlkitabInfo) {
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
