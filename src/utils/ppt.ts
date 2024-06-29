import { ALKITAB_INFO, ServiceMode } from "@/constants";
import { loadAlkitabDb } from "./db";
import { ServiceData } from "./pdf";
import PptxGenJS from "pptxgenjs";

export async function createServicePPT(serviceData: ServiceData) {
  var pptx = new PptxGenJS();

  const epistel = await getAlkitabtext(
    serviceData.mode,
    serviceData.epistelCode
  );
  epistel.forEach((content) => {
    addTextSlide(pptx, serviceData.epistel, content);
  });

  const jamita = await getAlkitabtext(serviceData.mode, serviceData.jamitaCode);
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

  const Y_MULTIPLIER = 1 / 1.33;
  slide.addText(title, {
    x: 1.85,
    y: 0.17 * Y_MULTIPLIER,
    w: 7.36,
    h: 0.71 * Y_MULTIPLIER,
    bold: true,
    fontSize: 36,
    fontFace: "Arial",
  });

  slide.addText(content, {
    x: 0.68,
    y: 1.84 * Y_MULTIPLIER,
    w: 8.64,
    h: 1.84 * Y_MULTIPLIER,
    fontSize: 36,
    fontFace: "Arial",
    valign: "top",
    autoFit: true,
  });
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
  return result;
}
