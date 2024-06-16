import JSZip from "jszip";
import { ParsedPdfData } from "./pdf";
import { getSongData } from "./song";

export async function createServiceFile(serviceData: ParsedPdfData) {
  const serviceJSON = [
    ...createEmptyService(),
    await createSongItem(serviceData, 0),
    createCustomItem("2", "Votum – Introitus – Doa"),
    await createSongItem(serviceData, 1),
    createCustomItem(
      "4",
      "Hukum Taurat",
      `Hukum Taurat : ${serviceData.patik}`
    ),
    await createSongItem(serviceData, 2),
    createCustomItem("6", "Pengakuan Dosa"),
    await createSongItem(serviceData, 3),
    createCustomItem("8", "Epistel", `Epistel : ${serviceData.epistel}`),
    await createSongItem(serviceData, 4),
    createCustomItem("10", "Pengakuan Iman Rasuli"),
    createCustomItem("11", "Koor"),
    createCustomItem("12", "Warta Jemaat"),
    await createSongItem(serviceData, 5),
    createCustomItem("15", "Khotbah", `Khotbah : ${serviceData.jamita}`),
    await createSongItem(serviceData, 6),
    createCustomItem("17", "Doa Persembahan – Berkat"),
  ];

  const zip = new JSZip();
  zip.file("service_data.osj", JSON.stringify(serviceJSON));
  const blob = await zip.generateAsync({ type: "blob" });

  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = "service.osz";
  document.body.appendChild(link);
  link.click();
}

async function createSongItem(serviceData: ParsedPdfData, idx: number) {
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

function createCustomItem(tag: string, _title: string, _text?: string) {
  const customJSON = createEmptyCustom();

  const prefix = "IN";
  const title = `${prefix} ${tag}-${_title}`;
  const text = _text || _title;

  customJSON.serviceitem.header.title = title;
  customJSON.serviceitem.header.footer = [title];
  customJSON.serviceitem.data.push({
    title: text,
    raw_slide: text,
    verseTag: tag,
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
