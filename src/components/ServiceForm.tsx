import { ServiceMode } from "@/constants";
import { createServiceFile } from "@/utils/openLp";
import { ParsedPdfData, ServiceData, SongVerseData } from "@/utils/pdf";
import { ChangeEvent, useState } from "react";

function ModeSelector(props: {
  value: ServiceMode;
  onChange: (value: ServiceMode) => void;
}) {
  function onChange(evt: ChangeEvent<HTMLInputElement>) {
    props.onChange(evt.target.value as ServiceMode);
  }

  return (
    <div>
      <input
        type="radio"
        id="mode-indo"
        name="mode"
        checked={props.value === ServiceMode.INDO}
        onChange={onChange}
        value={ServiceMode.INDO}
      />
      <label htmlFor="mode-indo">Indonesia</label>

      <input
        type="radio"
        id="mode-batak"
        name="mode"
        checked={props.value === ServiceMode.BATAK}
        onChange={onChange}
        value={ServiceMode.BATAK}
      />
      <label htmlFor="mode-batak">Batak</label>
    </div>
  );
}

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
  data: ServiceData;
  idx: Exclude<keyof ServiceData, "songs">;
}) {
  return (
    <div>
      <label>{props.order}</label>
      <input type="text" value={props.data[props.idx]} />
    </div>
  );
}

export function ServiceForm(props: { data: ParsedPdfData }) {
  const [mode, setMode] = useState<ServiceMode>(ServiceMode.INDO);

  const serviceData = props.data[mode];
  return (
    <form
      onSubmit={async (evt) => {
        evt.preventDefault();
        await createServiceFile(serviceData);
      }}
    >
      <ModeSelector value={mode} onChange={setMode} />

      <SongInput order={1} data={serviceData.songs} idx={0} />
      {/* votum */}
      <SongInput order={3} data={serviceData.songs} idx={1} />
      <TextInput order={4} data={serviceData} idx="patik" />
      <SongInput order={5} data={serviceData.songs} idx={2} />
      {/* pengakuan dosa*/}
      <SongInput order={7} data={serviceData.songs} idx={3} />
      <TextInput order={8} data={serviceData} idx="epistel" />
      <SongInput order={9} data={serviceData.songs} idx={4} />
      {/* pengakuan iman*/}
      {/* koor*/}
      {/* warta*/}
      {/* koor*/}
      <SongInput order={14} data={serviceData.songs} idx={5} />
      <TextInput order={15} data={serviceData} idx="jamita" />
      <SongInput order={17} data={serviceData.songs} idx={6} />
      <input type="submit" value={"Submit"} />
    </form>
  );
}
