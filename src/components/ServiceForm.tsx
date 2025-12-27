import {
  ALKITAB_INFO,
  SERVICE_INFO,
  ServiceMode,
  SongSource,
} from "@/constants";
import { downloadBlob } from "@/utils/blob";
import { createOpenLpFile } from "@/utils/openLp";
import {
  AlkitabInfo,
  ParsedPdfData,
  ServiceData,
  SongVerseData,
} from "@/utils/pdf";
import { createServicePPT } from "@/utils/ppt";
import JSZip from "jszip";
import {
  ChangeEvent,
  InputHTMLAttributes,
  MouseEvent,
  useEffect,
  useRef,
  useState,
} from "react";

async function createServiceFile(pdfData: ParsedPdfData, mode: ServiceMode) {
  if (!pdfData.serviceData[mode]) {
    return;
  }

  const [blobOpenLp, blobPpt] = await Promise.all([
    createOpenLpFile(pdfData.serviceData[mode]),
    createServicePPT(pdfData, mode),
  ]);

  const zip = new JSZip();
  if (blobOpenLp) zip.file("service.osz", blobOpenLp);
  if (blobPpt) zip.file("slide.pptx", blobPpt);

  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, "service.zip");
}

function ModeSelector(props: {
  value: ServiceMode;
  onChange: (value: ServiceMode) => void;
  data: ParsedPdfData;
}) {
  function onChange(evt: ChangeEvent<HTMLInputElement>) {
    props.onChange(evt.target.value as ServiceMode);
  }

  return (
    <div className="flex">
      {Object.values(ServiceMode).map((mode) => {
        if (!props.data.serviceData[mode]) {
          return null;
        }

        return (
          <div key={mode} className="flex items-center ps-3">
            <input
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-700 dark:focus:ring-offset-gray-700 focus:ring-2 dark:bg-gray-600 dark:border-gray-500"
              type="radio"
              id={`mode-${mode}`}
              name="mode"
              checked={props.value === mode}
              onChange={onChange}
              value={mode}
            />
            <label
              className="w-full py-3 ms-2 text-gray-900 dark:text-gray-300"
              htmlFor={`mode-${mode}`}
            >
              {SERVICE_INFO[mode].label}
            </label>
          </div>
        );
      })}
    </div>
  );
}

function SongInput(props: {
  order: number;
  data: ServiceData;
  idx: number;
  onChange: (data: ServiceData) => void;
}) {
  const song = props.data.songs[props.idx] ?? {};

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
      <select
        className="w-1/12 p-2.5 border-0 border-b-2 border-gray-200  focus:outline-none"
        value={song.source}
        onChange={(evt) => {
          handleChange({ source: evt.target.value as SongSource });
        }}
      >
        {Object.entries(SongSource).map(([key, val], i) => (
          <option key={i} value={val}>
            {key}
          </option>
        ))}
      </select>
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
    "songs" | "mode" | "epistelInfo" | "jamitaInfo" | "responsoriaText"
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

function BibleInput(props: {
  data: ServiceData;
  idx: "epistelInfo" | "jamitaInfo";
  onChange: (data: ServiceData) => void;
}) {
  const [errors, setErrors] = useState<Partial<AlkitabInfo>>({});

  const info = props.data[props.idx];

  function handleChange(val: Partial<AlkitabInfo>) {
    const newData: ServiceData = {
      ...props.data,
    };
    newData[props.idx] = {
      ...info,
      ...val,
    };
    props.onChange(newData);
  }
  return (
    <>
      <div className="flex mb-1">
        <div className="w-3/12"></div>
        <label htmlFor="underline_select" className="sr-only">
          Underline select
        </label>
        <select
          id="underline_select"
          className="w-4/12 p-2.5 border-0 border-b-2 border-gray-200  focus:outline-none"
          defaultValue={info.book}
        >
          {ALKITAB_INFO[props.data.mode].map((str, i) => (
            <option key={i} value={str}>
              {str}
            </option>
          ))}
        </select>
        <input
          className="w-2/12 p-2.5 ml-2.5 border rounded-lg block"
          type="number"
          value={info.chapter}
          onChange={(evt) => {
            handleChange({ chapter: evt.target.value });
          }}
        />{" "}
        <NumberListInput
          value={info.verses}
          errorMsg={errors.verses}
          onChange={([error, verses]) => {
            setErrors({
              ...errors,
              verses: error
                ? 'Format ayat harus angka dipisah koma CTH "1,2,3"'
                : undefined,
            });
            handleChange({ verses });
          }}
        />
      </div>
      {errors.verses && (
        <div className="flex mb-1 text-red-600 dark:text-red-500">
          <div className="w-1/12"></div>
          <div className="w-11/12 p-2.5">
            <span className="font-medium">Error : {errors.verses}</span>
          </div>
        </div>
      )}
    </>
  );
}

function NumberListInput(props: {
  value: string;
  errorMsg?: String;
  onChange: (result: [boolean, string]) => void;
}) {
  return (
    <input
      className={
        "w-2/12 p-2.5 ml-2.5 border rounded-lg block" +
        (props.errorMsg
          ? " bg-red-50 border-red-500 text-red-900 placeholder-red-700 focus:ring-red-500 dark:bg-gray-700 focus:border-red-500 dark:text-red-500 dark:placeholder-red-500 dark:border-red-500"
          : "")
      }
      type="texts"
      value={props.value}
      onChange={(evt) => {
        const list = evt.target.value.split(",");
        const error = list.some((val) => !val || isNaN(+val));

        props.onChange([error, evt.target.value]);
      }}
    />
  );
}

function CanvasView(
  props: { canvas: HTMLCanvasElement } & InputHTMLAttributes<HTMLDivElement>
) {
  const container = useRef<HTMLDivElement>(null);
  HTMLDivElement;
  useEffect(() => {
    if (!container.current) return;
    container.current.innerHTML = "";
    container.current.append(props.canvas);
  }, [container, props.canvas]);

  return <div ref={container} {...props} />;
}

export function ServiceForm(props: {
  data: ParsedPdfData;
  onChange: (data: ParsedPdfData) => void;
  onReset: () => void;
}) {
  const [mode, setMode] = useState<ServiceMode>(
    Object.keys(props.data.serviceData)[0] as ServiceMode
  );

  const serviceData = props.data.serviceData[mode];

  function handleChange(val: ServiceData) {
    props.onChange({
      ...props.data,
      serviceData: {
        ...props.data.serviceData,
        [mode]: val,
      },
    });
  }

  function handleReset(evt: MouseEvent) {
    evt.preventDefault();
    props.onReset();
  }

  const images = [
    ...(props.data.serviceTableImage ? [props.data.serviceTableImage] : []),
    ...props.data.wartaImages,
  ];

  return (
    <div className="flex  items-center justify-center">
      <form
        className="max-w-4xl mx-auto m-5"
        onSubmit={async (evt) => {
          evt.preventDefault();

          await createServiceFile(props.data, mode);
        }}
      >
        <ModeSelector value={mode} onChange={setMode} data={props.data} />
        {serviceData && (
          <>
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
              <BibleInput
                data={serviceData}
                idx="epistelInfo"
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
              <BibleInput
                data={serviceData}
                idx="jamitaInfo"
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

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-10">
              {images.map((image, i) => {
                image.className = "h-auto max-w-full rounded-lg";
                return <CanvasView key={i} canvas={image} />;
              })}
            </div>
          </>
        )}
      </form>
    </div>
  );
}
