import { JsonInput } from "@/components/JsonInput";
import { ServiceForm } from "@/components/ServiceForm";
import { ParsedPdfData } from "@/utils/pdf";
import { useState } from "react";

export default function Page() {
  const [pdfData, setPdfData] = useState<ParsedPdfData | null>(null);
  return (
    <>
      {!pdfData && <JsonInput onChange={setPdfData} />}
      {pdfData && (
        <ServiceForm
          data={pdfData}
          onChange={setPdfData}
          onReset={() => setPdfData(null)}
        />
      )}
    </>
  );
}
