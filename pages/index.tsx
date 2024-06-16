import { PdfInput } from "@/components/PdfInput";
import { ServiceForm } from "@/components/ServiceForm";
import { ParsedPdfData } from "@/utils/pdf";
import { useState } from "react";

export default function Page() {
  const [pdfData, setPdfData] = useState<ParsedPdfData | null>(null);
  return (
    <>
      <h1>Upload PDF Warta Jemaat</h1>;
      <PdfInput onChange={setPdfData} />
      {pdfData && <ServiceForm data={pdfData} />}
    </>
  );
}
