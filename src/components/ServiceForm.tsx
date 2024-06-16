import { createServiceFile } from "@/utils/openLp";
import { ParsedPdfData, SongVerseData } from "@/utils/pdf";

function SongInput(props: {
  order: number;
  data: SongVerseData[];
  idx: number;
}) {
  const song = props.data[props.idx];
  return (
    <div>
      <label>{props.order}</label>
      <input value={song.songNum} />
      <input
        value={Array.isArray(song.verses) ? song.verses.join(",") : song.verses}
      />
    </div>
  );
}

function TextInput(props: {
  order: number;
  data: ParsedPdfData;
  idx: Exclude<keyof ParsedPdfData, "songs">;
}) {
  return (
    <div>
      <label>{props.order}</label>
      <input type="text" value={props.data[props.idx]} />
    </div>
  );
}

export function ServiceForm(props: { data: ParsedPdfData }) {
  return (
    <form
      onSubmit={async (evt) => {
        evt.preventDefault();

        await createServiceFile(props.data);
      }}
    >
      <SongInput order={1} data={props.data.songs} idx={0} />
      {/* votum */}
      <SongInput order={3} data={props.data.songs} idx={1} />
      <TextInput order={4} data={props.data} idx="patik" />
      <SongInput order={5} data={props.data.songs} idx={2} />
      {/* pengakuan dosa*/}
      <SongInput order={7} data={props.data.songs} idx={3} />
      <TextInput order={8} data={props.data} idx="epistel" />
      <SongInput order={9} data={props.data.songs} idx={4} />
      {/* pengakuan iman*/}
      {/* koor*/}
      {/* warta*/}
      {/* koor*/}
      <SongInput order={14} data={props.data.songs} idx={5} />
      <TextInput order={15} data={props.data} idx="jamita" />
      <SongInput order={17} data={props.data.songs} idx={6} />
      <input type="submit" value={"Submit"} />
    </form>
  );
}
