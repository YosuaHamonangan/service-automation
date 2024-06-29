import { SERVICE_INFO, ServiceMode } from "@/constants";
import { createServiceFile } from "@/utils/openLp";
import { ParsedPdfData, ServiceData, SongVerseData } from "@/utils/pdf";
import { createServicePPT } from "@/utils/ppt";
import { ChangeEvent, MouseEvent, useState } from "react";

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

function SongInput(props: {
  order: number;
  data: ServiceData;
  idx: number;
  onChange: (data: ServiceData) => void;
}) {
  const song = props.data.songs[props.idx];

  function handleChange(val: Partial<SongVerseData>) {
    const newData: ServiceData = {
      ...props.data,
      songs: [...props.data.songs],
    };
    newData.songs[props.idx] = { ...song, ...val };
    props.onChange(newData);
  }

  return (
    <div className="flex mb-1">
      <div className="w-1/12  p-2.5">{props.order}</div>
      <label className="w-1/12 p-2.5">{props.data.mode}</label>
      <input
        className="w-5/12 p-2.5 border rounded-lg block"
        value={song.songNum}
        onChange={(evt) => {
          handleChange({ songNum: evt.target.value.trim() });
        }}
      />
      <input
        className="w-2/12 p-2.5 ml-2.5 border rounded-lg block"
        value={Array.isArray(song.verses) ? song.verses.join(",") : song.verses}
        onChange={(evt) => {
          let verses: number[] | "all";
          if (evt.target.value === "") {
            verses = "all";
          } else {
            verses = evt.target.value
              .split(",")
              .map((val) => +val)
              .filter((val) => !isNaN(val));
            if (!verses.length) verses.push(1);
          }
          handleChange({ verses });
        }}
      />
      <input
        className="w-2/12 p-2.5 ml-2.5 border rounded-lg block"
        value={song.standVerse ?? ""}
        onChange={(evt) => {
          const val = +evt.target.value.trim();
          if (!val) {
            return handleChange({ standVerse: undefined });
          }

          if (isNaN(val)) return;
          handleChange({ standVerse: val });
        }}
      />
    </div>
  );
}

function TextInput(props: {
  order: number;
  data: ServiceData;
  idx: Exclude<
    keyof ServiceData,
    "songs" | "mode" | "epistelCode" | "jamitaCode"
  >;
  onChange: (data: ServiceData) => void;
}) {
  return (
    <div className="flex mb-1">
      <div className="w-1/12  p-2.5">{props.order}</div>
      <div className="w-2/12 p-2.5 whitespace-nowrap overflow-clip">
        {SERVICE_INFO[props.data.mode].static[props.idx]} :
      </div>
      <input
        className="w-4/12 p-2.5 border rounded-lg block"
        type="text"
        value={props.data[props.idx]}
        onChange={(evt) => {
          const newData: ServiceData = {
            ...props.data,
            songs: [...props.data.songs],
          };
          newData[props.idx] = evt.target.value;
          props.onChange(newData);
        }}
      />
    </div>
  );
}

export function ServiceForm(props: {
  data: ParsedPdfData;
  onChange: (data: ParsedPdfData) => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<ServiceMode>(ServiceMode.INDO);

  const serviceData = props.data[mode];

  function handleChange(val: ServiceData) {
    props.onChange({
      ...props.data,
      [mode]: val,
    });
  }

  function handleReset(evt: MouseEvent) {
    evt.preventDefault();
    props.onReset();
  }
  return (
    <div className="flex h-screen items-center justify-center">
      <form
        className="max-w-4xl mx-auto m-5"
        onSubmit={async (evt) => {
          evt.preventDefault();
          await Promise.all([
            createServiceFile(serviceData),
            createServicePPT(serviceData),
          ]);
        }}
      >
        <ModeSelector value={mode} onChange={setMode} />
        <div>
          <SongInput
            order={1}
            data={serviceData}
            idx={0}
            onChange={handleChange}
          />
          {/* votum */}
          <SongInput
            order={3}
            data={serviceData}
            idx={1}
            onChange={handleChange}
          />
          <TextInput
            order={4}
            data={serviceData}
            idx="patik"
            onChange={handleChange}
          />
          <SongInput
            order={5}
            data={serviceData}
            idx={2}
            onChange={handleChange}
          />
          {/* pengakuan dosa*/}
          <SongInput
            order={7}
            data={serviceData}
            idx={3}
            onChange={handleChange}
          />
          <TextInput
            order={8}
            data={serviceData}
            idx="epistel"
            onChange={handleChange}
          />
          <SongInput
            order={9}
            data={serviceData}
            idx={4}
            onChange={handleChange}
          />
          {/* pengakuan iman*/}
          {/* koor*/}
          {/* warta*/}
          {/* koor*/}
          <SongInput
            order={14}
            data={serviceData}
            idx={5}
            onChange={handleChange}
          />
          <TextInput
            order={15}
            data={serviceData}
            idx="jamita"
            onChange={handleChange}
          />
          <SongInput
            order={17}
            data={serviceData}
            idx={6}
            onChange={handleChange}
          />
        </div>
        <div className="flex justify-end px-10">
          <button
            onClick={handleReset}
            className="text-white m-4 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg w-28 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            Reset
          </button>

          <input
            className="text-white m-4 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg w-28 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
            type="submit"
            value="Generate"
          />
        </div>
      </form>
    </div>
  );
}
