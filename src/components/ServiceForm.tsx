import { SERVICE_INFO, ServiceMode } from "@/constants";
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
    <div className="flex">
      <div className="flex items-center ps-3">
        <input
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
          type="radio"
          id="mode-indo"
          name="mode"
          checked={props.value === ServiceMode.INDO}
          onChange={onChange}
          value={ServiceMode.INDO}
        />
        <label
          className="w-full py-3 ms-2 text-gray-900 dark:text-gray-300"
          htmlFor="mode-indo"
        >
          Indonesia
        </label>
      </div>

      <div className="flex items-center ps-3">
        <input
          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
          type="radio"
          id="mode-batak"
          name="mode"
          checked={props.value === ServiceMode.BATAK}
          onChange={onChange}
          value={ServiceMode.BATAK}
        />
        <label
          className="w-full py-3 ms-2 text-gray-900 dark:text-gray-300"
          htmlFor="mode-batak"
        >
          Batak
        </label>
      </div>
    </div>
  );
}

function SongInput(props: { order: number; data: ServiceData; idx: number }) {
  const song = props.data.songs[props.idx];
  return (
    <div className="flex mb-1">
      <div className="w-1/12  p-2.5">{props.order}</div>
      <label className="w-1/12 p-2.5">{props.data.mode}</label>
      <input
        className="w-4/12 p-2.5 border rounded-lg block"
        value={song.songNum}
      />
      <input
        className="w-2/12 p-2.5 ml-2.5 border rounded-lg block"
        value={Array.isArray(song.verses) ? song.verses.join(",") : song.verses}
      />
      <input
        className="w-2/12 p-2.5 ml-2.5 border rounded-lg block"
        value={song.standVerse ?? ""}
      />
    </div>
  );
}

function TextInput(props: {
  order: number;
  data: ServiceData;
  idx: Exclude<keyof ServiceData, "songs" | "mode">;
}) {
  return (
    <div className="flex mb-1">
      <div className="w-1/12  p-2.5">{props.order}</div>
      <div className="w-2/12 p-2.5">
        {SERVICE_INFO[props.data.mode].static[props.idx]} :
      </div>
      <input
        className="w-3/12 p-2.5 border rounded-lg block"
        type="text"
        value={props.data[props.idx]}
      />
    </div>
  );
}

export function ServiceForm(props: { data: ParsedPdfData }) {
  const [mode, setMode] = useState<ServiceMode>(ServiceMode.INDO);

  const serviceData = props.data[mode];
  return (
    <form
      className="max-w-4xl mx-auto m-5"
      onSubmit={async (evt) => {
        evt.preventDefault();
        await createServiceFile(serviceData);
      }}
    >
      <ModeSelector value={mode} onChange={setMode} />

      <div>
        <SongInput order={1} data={serviceData} idx={0} />
        {/* votum */}
        <SongInput order={3} data={serviceData} idx={1} />
        <TextInput order={4} data={serviceData} idx="patik" />
        <SongInput order={5} data={serviceData} idx={2} />
        {/* pengakuan dosa*/}
        <SongInput order={7} data={serviceData} idx={3} />
        <TextInput order={8} data={serviceData} idx="epistel" />
        <SongInput order={9} data={serviceData} idx={4} />
        {/* pengakuan iman*/}
        {/* koor*/}
        {/* warta*/}
        {/* koor*/}
        <SongInput order={14} data={serviceData} idx={5} />
        <TextInput order={15} data={serviceData} idx="jamita" />
        <SongInput order={17} data={serviceData} idx={6} />
      </div>

      <input
        className="text-white m-4 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
        type="submit"
        value="Generate OpenLP"
      />
    </form>
  );
}
