export const EXTRACT_PROMPT = `Kamu akan menerima sebuah PDF liturgi HKBP. Tugasmu adalah mengekstrak isi PDF dan menghasilkan 1 objek JSON dengan format:
export enum ServiceMode {
  INDO = "INDO",
  BATAK = "BATAK",
}
export const ALKITAB_INFO: Record<ServiceMode, string[]> = {
  [ServiceMode.INDO]: [
    "Kejadian",
    "Keluaran",
    "Imamat",
    "Bilangan",
    "Ulangan",
    "Yosua",
    "Hakim-hakim",
    "Rut",
    "1 Samuel",
    "2 Samuel",
    "1 Raja-raja",
    "2 Raja-raja",
    "1 Tawarikh",
    "2 Tawarikh",
    "Ezra",
    "Nehemia",
    "Ester",
    "Ayub",
    "Mazmur",
    "Amsal",
    "Pengkhotbah",
    "Kidung Agung",
    "Yesaya",
    "Yeremia",
    "Ratapan",
    "Yehezkiel",
    "Daniel",
    "Hosea",
    "Yoel",
    "Amos",
    "Obaja",
    "Yunus",
    "Mikha",
    "Nahum",
    "Habakuk",
    "Zefanya",
    "Hagai",
    "Zakharia",
    "Maleakhi",
    "Matius",
    "Markus",
    "Lukas",
    "Yohanes",
    "Kisah Para Rasul",
    "Roma",
    "1 Korintus",
    "2 Korintus",
    "Galatia",
    "Efesus",
    "Filipi",
    "Kolose",
    "1 Tesalonika",
    "2 Tesalonika",
    "1 Timotius",
    "2 Timotius",
    "Titus",
    "Filemon",
    "Ibrani",
    "Yakobus",
    "1 Petrus",
    "2 Petrus",
    "1 Yohanes",
    "2 Yohanes",
    "3 Yohanes",
    "Yudas",
    "Wahyu",
  ],
  [ServiceMode.BATAK]: [
    "1 Musa",
    "2 Musa",
    "3 Musa",
    "4 Musa",
    "5 Musa",
    "Josua",
    "Panguhum",
    "Rut",
    "1 Samuel",
    "2 Samuel",
    "1 Raja-raja",
    "2 Raja-raja",
    "1 Kronika",
    "2 Kronika",
    "Esra",
    "Nehemia",
    "Ester",
    "Job",
    "Psalmen",
    "Poda",
    "Parjamita",
    "Angka Ende",
    "Jesaya",
    "Jeremia",
    "Andung-andung",
    "Hesekiel",
    "Daniel",
    "Hosea",
    "Joel",
    "Amos",
    "Obaja",
    "Jona",
    "Mika",
    "Nahum",
    "Habakuk",
    "Sepania",
    "Haggai",
    "Sakaria",
    "Maleaki",
    "Mateus",
    "Markus",
    "Lukas",
    "Johannes",
    "Ulaon ni Apostel",
    "Rom",
    "1 Korint",
    "2 Korint",
    "Galatia",
    "Epesus",
    "Pilippi",
    "Kolosse",
    "1 Tessalonik",
    "2 Tessalonik",
    "1 Timoteus",
    "2 Timoteus",
    "Titus",
    "Pilemon",
    "Heber",
    "Jakobus",
    "1 Petrus",
    "2 Petrus",
    "1 Johannes",
    "2 Johannes",
    "3 Johannes",
    "Judas",
    "Pangungkapon",
  ],
};


export enum SongSource {
  BE = "BE",
  BN = "BN",
  KJ = "KJ",
  PKJ = "PKJ",
  NKB = "NKB",
}

export interface SongVerseData {
  source: SongSource; // sumber buku lagu
  songNum: string; // nomor lagunya saja. e.g. 123 atau 101a
  verses: number[] | "all";
  standVerse?: number;
}

// untuk semua text yang bukan lagu, termasuk votum, pengakuan dosa, epistel, doa, dan proses lainnya
export interface ResponsoriaTextData {
  title: string; // judul yang ada pada file. tidak perlu menggunakan angka e.g. "Epistel"
  text: string[]; // text responsoria, setiap element untuk 1 dialog e.g. ["H: ....", "U: ..."]
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

Jangan merubah/mengurangi/menambah tulisan apapun yang ada di file
Jangan menambahkan penjelasan apa pun di luar JSON.`;
