import { ServiceMode } from "@/constants";
import { ParsedPdfData, ServiceData } from "@/utils/pdf";
import { useState } from "react";

export function JsonInput(props: { onChange: (data: ParsedPdfData) => void }) {
  const [json, setJson] = useState<string>("");
  return (
    <div>
      <label
        htmlFor="message"
        className="block mb-2.5 text-sm font-medium text-heading"
      >
        Your message
      </label>
      <textarea
        id="message"
        rows={4}
        className="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body"
        placeholder="Write your thoughts here..."
        value={json}
        onChange={(e) => setJson(e.target.value)}
      ></textarea>

      <button
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
        Parse
      </button>
    </div>
  );
}
