import JSZip from "jszip";
import { ServiceData } from "./pdf";
import { getSongData } from "./song";
import { SERVICE_INFO, ServiceMode } from "@/constants";
import { loadSongDb } from "./db";

export async function createAllOpenLpSongFile(
  mode: ServiceMode,
  onUpdate?: (progress: number | null) => void
) {
  onUpdate?.(0);
  const db = await loadSongDb(mode);

  const zip = new JSZip();
  for (let i = 0; i < db.length; i++) {
    const { num } = db[i];
    const slideData = await getSongData(num, mode);
    if (!slideData) continue;
    slideData.xml;
    await zip.file(
      `${mode} ${num} (${SERVICE_INFO[mode].author}).xml`,
      slideData.xml
    );
    onUpdate?.((i + 1) / db.length);
  }

  return await zip.generateAsync({ type: "blob" });
}

export async function createOpenLpFile(serviceData: ServiceData) {
  const serviceJSON = [
    ...createEmptyService(),
    await createSongItem(serviceData, 0),
    createCustomItem(serviceData, "votum"),
    await createSongItem(serviceData, 1),
    createCustomItem(serviceData, "patik", "patik"),
    await createSongItem(serviceData, 2),
    createCustomItem(serviceData, "dosa"),
    await createSongItem(serviceData, 3),
    createCustomItem(serviceData, "epistel", "epistel"),
    await createSongItem(serviceData, 4),
    createCustomItem(serviceData, "iman"),
    createCustomItem(serviceData, "warta"),
    await createSongItem(serviceData, 5),
    createCustomItem(serviceData, "jamita", "jamita"),
    await createSongItem(serviceData, 6),
    createCustomItem(serviceData, "doa"),
  ];

  const zip = new JSZip();
  zip.file("service_data.osj", JSON.stringify(serviceJSON));
  return await zip.generateAsync({ type: "blob" });
}

async function createSongItem(serviceData: ServiceData, idx: number) {
  const { songNum, verses, standVerse } = serviceData.songs[idx];

  const songData = await getSongData(songNum, serviceData.mode);
  if (!songData) throw new Error("Song not found");

  const titleSlide = songData.verseSlides[0];
  const standSlide = songData.verseSlides[songData.verseSlides.length - 1];
  const slides = [];
  const verseOrder = [];
  if (verses !== "all") {
    slides.push(titleSlide);
    verseOrder.push(titleSlide.verseTag);

    verses.forEach((val) => {
      if (standVerse && standVerse === val) {
        slides.push(standSlide);
        verseOrder.push(standSlide.verseTag);
      }

      const slide = songData.verseSlides[val];
      slides.push(slide);
      verseOrder.push(slide.verseTag);
    });
  }
  slides.push(...songData.verseSlides);
  verseOrder.push(...songData.verseOrder);

  const songJSONstr = JSON.stringify(createEmptySong())
    .replace(/\$title/g, songData.titleNum)
    .replace(/\$author/g, songData.author);

  const songJSON = JSON.parse(songJSONstr);

  songJSON.serviceitem.header.xml_version = songData.xml.replace(
    songData.verseOrder.join(" "),
    verseOrder.join(" ")
  );

  const slidesData: any[] = [];
  slides.forEach(({ slides, verseTag }) => {
    slides.forEach((txt) => {
      slidesData.push({
        title: txt.split("</br>")[0],
        raw_slide: txt,
        verseTag: verseTag,
      });
    });
  });
  songJSON.serviceitem.data = slidesData;

  return songJSON;
}

function createEmptyService() {
  return [
    {
      openlp_core: {
        "lite-service": false,
        "service-theme": null,
        "openlp-servicefile-version": 3,
      },
    },
  ];
}

function createEmptySong() {
  return {
    serviceitem: {
      header: {
        name: "songs",
        plugin: "songs",
        theme: null,
        title: "$title",
        footer: ["$title", "Written by: $author"],
        type: 1,
        audit: ["$title", ["$author"], "", ""],
        notes: "",
        from_plugin: false,
        capabilities: [2, 1, 5, 8, 9, 13, 22],
        search: "",
        data: {
          title: "$title@",
          alternate_title: "",
          authors: "$author",
          ccli_number: "",
          copyright: "",
        },
        xml_version: "$xml",
        auto_play_slides_once: false,
        auto_play_slides_loop: false,
        timed_slide_interval: 0,
        start_time: 0,
        end_time: 0,
        media_length: 0,
        background_audio: [],
        theme_overwritten: false,
        will_auto_start: false,
        processor: null,
        metadata: [],
        sha256_file_hash: null,
        stored_filename: null,
      },
      data: [],
    },
  };
}

function createCustomItem(
  serviceData: ServiceData,
  staticKey: keyof (typeof SERVICE_INFO)["BE"]["static"],
  dataKey?: Exclude<keyof ServiceData, "songs">
) {
  const customJSON = createEmptyCustom();

  const mode = serviceData.mode;
  const title = SERVICE_INFO[mode].static[staticKey];
  const text = dataKey ? `${title} : ${serviceData[dataKey]}` : title;

  customJSON.serviceitem.header.title = title;
  customJSON.serviceitem.header.footer = [title];
  customJSON.serviceitem.data.push({
    title: text,
    raw_slide: text,
    verseTag: staticKey,
  });

  return customJSON;
}

function createEmptyCustom() {
  return {
    serviceitem: {
      header: {
        name: "custom",
        plugin: "custom",
        theme: null,
        title: "$title",
        footer: ["$title"],
        type: 1,
        audit: "",
        notes: "",
        from_plugin: false,
        capabilities: [2, 1, 5, 13, 8, 14],
        search: "",
        data: "",
        xml_version: null,
        auto_play_slides_once: false,
        auto_play_slides_loop: false,
        timed_slide_interval: 0,
        start_time: 0,
        end_time: 0,
        media_length: 0,
        background_audio: [],
        theme_overwritten: false,
        will_auto_start: false,
        processor: null,
        metadata: [],
        sha256_file_hash: null,
        stored_filename: null,
      },
      data: [] as any[],
    },
  };
}
