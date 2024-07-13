import { ServiceMode } from "@/constants";
import { downloadBlob } from "@/utils/blob";
import { createAllOpenLpSongFile } from "@/utils/openLp";
import { useState } from "react";

function DownloadButton(props: { mode: ServiceMode; text: string }) {
  const [progress, setProgress] = useState<number | null>(null);
  async function createAndDownload() {
    if (progress !== null) return;

    try {
      const blob = await createAllOpenLpSongFile(props.mode, (newProgress) => {
        setProgress(newProgress);
      });
      downloadBlob(blob, `result-${props.mode}.zip`);
    } finally {
      setProgress(null);
    }
  }

  return (
    <button
      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
      onClick={createAndDownload}
    >
      <svg
        className="fill-current w-4 h-4 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
      >
        <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
      </svg>
      <span>{props.text}</span>
      {progress !== null && (
        <span className="ml-1">- {Math.round(progress * 100)}%</span>
      )}
    </button>
  );
}

export default function Page() {
  return (
    <div>
      <div className="flex justify-center mb-4">
        Pilih database lagu yang ingin di download
      </div>
      <div className="flex items-center justify-center space-x-4">
        <DownloadButton mode={ServiceMode.INDO} text="Buku Nyanyian HKBP" />
        <DownloadButton mode={ServiceMode.BATAK} text="Buku Ende" />
      </div>
    </div>
  );
}
