export interface SongLyricData {
  num: string;
  title: string;
  lyric: string[];
}

export interface SongSlideData extends SongLyricData {
  titleNum: string;
  verseSlides: {
    verseTag: string;
    slides: string[];
  }[];
  author: string;
  verseOrder: string[];
  xml: string;
}

export type SongDb = SongLyricData[];
