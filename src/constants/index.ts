export enum ServiceMode {
  INDO = "BN",
  BATAK = "BE",
}

export const SERVICE_INFO = {
  [ServiceMode.INDO]: {
    author: "Buku Nyanyian HKBP",
    stand: "Berdiri",
    db: "/db/BN.json",
  },
  [ServiceMode.BATAK]: {
    author: "Buku Ende",
    stand: "Jongjong",
    db: "/db/BE.json",
  },
};

export enum TEMPLATE_KEY {
  SONG_XML = "song_xml",
}
