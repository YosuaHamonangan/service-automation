import { ServiceMode } from "@/constants";
import { ParsedPdfData, parsePdfData } from "@/utils/pdf";
import { FileUploader } from "react-drag-drop-files";

const fileTypes = ["PDF"];

interface Props {
  onChange: (result: ParsedPdfData) => void;
}

export function PdfInput(props: Props) {
  const handleChange = async (file: File) => {
    const parsedData = await parsePdfData(file, ServiceMode.INDO);
    props.onChange(parsedData);
  };
  return (
    <FileUploader handleChange={handleChange} name="file" types={fileTypes} />
  );
}
