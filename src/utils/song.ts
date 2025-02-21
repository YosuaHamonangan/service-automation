import { SONG_INFO, SongSource, TEMPLATE_KEY } from "@/constants";
import { loadSongDb } from "./db";
import { SongSlideData } from "@/types";
import { loadTemplate } from "./template";

export async function getSongData(songNum: string, source: SongSource) {
  const songData = (await loadSongDb(source)).find(
    ({ num }) => num === songNum
  );
  if (!songData) return;

  const { title, num } = songData;

  const titleNum = `${source} ${num}`;

  const lyric = songData.lyric.filter((l) => l);

  const verseSlides = [];
  const verseOrder = [];

  verseSlides.push({
    verseTag: "V0",
    slides: [`${titleNum}<br/>${title}`],
  });
  verseOrder.push("V0");

  lyric.forEach((lyric, i) => {
    const verseTag = `V${i + 1} `;
    verseSlides.push({
      verseTag,
      slides: splitVerseText(`${i + 1}. ${lyric}`),
    });
    verseOrder.push(verseTag);
  });

  const spSlideIdx = verseOrder.length;

  verseSlides.push({
    verseTag: "O1",
    slides: [`--- ${SONG_INFO[source].stand} ---`],
  });
  verseOrder.push("O1");

  verseSlides.push({
    verseTag: "O2",
    slides: [`--- ${SONG_INFO[source].music} ---`],
  });
  verseOrder.push("O2");

  const result: SongSlideData = {
    title,
    titleNum,
    num,
    lyric,
    verseSlides,
    spSlideIdx,
    author: SONG_INFO[source].author,
    verseOrder,
    xml: "",
  };

  result.xml = await createSongXML(result, true);

  return result;
}

async function createSongXML(songData: SongSlideData, isAutomation = false) {
  const { titleNum, verseSlides, author, verseOrder } = songData;

  let lyrics = "";
  verseSlides.forEach(({ verseTag, slides }) => {
    slides.forEach((txt, i) => {
      const tag = verseTag + (slides.length ? String.fromCharCode(97 + i) : "");
      lyrics += "\n";
      lyrics += createVerseXMLText(tag, txt);
    });
  });

  const xml = (await loadTemplate(TEMPLATE_KEY.SONG_XML))
    .replace("@{title}", titleNum)
    .replace("@{author}", author + (isAutomation ? " - automate" : ""))
    .replace("@{verseOrder}", verseOrder.join(" "))
    .replace("@{lyrics}", lyrics);

  return xml;
}

function createVerseXMLText(verseTag: string, lines: string) {
  return `    <verse name="${verseTag}">
        <lines>${lines}</lines>
      </verse>`;
}

export function splitVerseText(verseText: string) {
  const result: string[] = [];

  verseText
    .split("\n")
    .filter((l) => l)
    .forEach((line, i) => {
      if (i % 2 === 0) {
        result[i / 2] = line;
      } else {
        result[(i - 1) / 2] += `<br/>${line}`;
      }
    });

  return result;
}
