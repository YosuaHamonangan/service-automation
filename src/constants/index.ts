export enum ServiceMode {
  INDO = "BN",
  BATAK = "BE",
}

export const SERVICE_INFO = {
  [ServiceMode.INDO]: {
    author: "Buku Nyanyian HKBP",
    stand: "Berdiri",
    db: "/db/BN.json",
    patikFormat: "Hukum Taurat\\ ?:?\\ ?(.+)",
    epistelFormat: "Epistel\\ ?:?\\ ?(.+)",
    jamitaFormat: "Khotbah\\ ?:?\\ ?(.+)",
    standFormat: "ayat([0-9]+)berdiri",
    static: {
      votum: "Votum – Introitus – Doa",
      patik: "Hukum Taurat",
      dosa: "Pengakuan Dosa",
      epistel: "Epistel",
      iman: "Pengakuan Iman Rasuli",
      warta: "Warta Jemaat",
      jamita: "Khotbah",
      doa: "Doa Persembahan – Berkat",
    },
  },
  [ServiceMode.BATAK]: {
    author: "Buku Ende",
    stand: "Jongjong",
    db: "/db/BE.json",
    patikFormat: "Patik\\ ?:?\\ ?(.+)",
    epistelFormat: "Epistel\\ ?:?\\ ?(.+)",
    jamitaFormat: "Khotbah\\ ?:?\\ ?(.+)",
    standFormat: "ayat([0-9]+)jongjong",
    static: {
      votum: "Votum – Introitus – Tangiang",
      patik: "Patik",
      dosa: "Manopoti Dosa",
      epistel: "Epistel",
      iman: "Manghatindanghon Haporseaon",
      warta: "Tingting Huria",
      jamita: "Khotbah",
      doa: "Tangiang Pelean – Pasupasu",
    },
  },
};

export enum TEMPLATE_KEY {
  SONG_XML = "song_xml",
}
