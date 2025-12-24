import { ServiceMode } from "@/constants";
import { EXTRACT_PROMPT } from "@/constants/prompt";
import { ParsedPdfData, ServiceData } from "@/utils/pdf";
import { useState } from "react";

export function JsonInput(props: { onChange: (data: ParsedPdfData) => void }) {
  const [json, setJson] = useState<string>("");
  return (
    <div className="m-10">
      <div className="mb-8">
        Tutorial{" "}
        <a
          href="/images/tutorial-json.png"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        >
          ?
        </a>
      </div>
      <label
        htmlFor="message"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Click untuk copy prompt
      </label>
      <button
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mb-8"
        onClick={() => {
          navigator.clipboard.writeText(EXTRACT_PROMPT);
        }}
      >
        Copy Prompt
      </button>

      <label
        htmlFor="message"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Paste prompt ke gemini dan upload file kebaktian
      </label>
      <a
        href="https://gemini.google.com/"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center mb-8"
      >
        Buka Gemini
      </a>

      <label
        htmlFor="message"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Copy JSON dari gemini Kebawah
      </label>
      <textarea
        id="message"
        rows={4}
        className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body mb-8"
        placeholder="Hasil dari gemini"
        value={json}
        onChange={(e) => setJson(e.target.value)}
      ></textarea>

      <button
        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
        onClick={() => {
          try {
            const data: ServiceData = JSON.parse(json);

            const parsedData: ParsedPdfData = {
              serviceData: {
                [ServiceMode.INDO]: { ...data, mode: ServiceMode.INDO },
                [ServiceMode.BATAK]: { ...data, mode: ServiceMode.BATAK },
              },
              serviceTableImage: undefined,
              wartaImages: [],
            };
            console.log(parsedData);
            props.onChange(parsedData);
          } catch (error) {
            console.error(error);
            alert("Invalid JSON");
          }
        }}
      >
        Submit
      </button>
    </div>
  );
}
