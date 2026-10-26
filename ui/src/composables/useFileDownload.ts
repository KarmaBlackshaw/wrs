import { http } from "@/lib/http";
import { getFileBlob } from "@/services/file";

const REVOKE_DELAY_MS = 60_000;

function toObjectUrl(blob: Blob) {
  const url = URL.createObjectURL(blob);

  // ponytail: fixed delay so a new tab finishes loading before revoke; no load signal exists for a cross-window blob
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);

  return url;
}

function clickDownload(url: string, filename: string) {
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();
}

export function useFileDownload() {
  async function open(fileId: string) {
    const tab = window.open("", "_blank");

    try {
      const blob = await getFileBlob(fileId);
      const url = toObjectUrl(blob);

      if (tab == null) {
        clickDownload(url, fileId);
      } else {
        tab.location.href = url;
      }
    } catch (caught) {
      tab?.close();
      throw caught;
    }
  }

  async function downloadCsv(slug: string, range: { from?: string; to?: string }) {
    const blob = await http.get<Blob>(`/reports/${slug}/csv`, { params: range, responseType: "blob" });
    const filename = [slug, range.from, range.to].filter((part) => part != null).join("_");

    clickDownload(toObjectUrl(blob), `${filename}.csv`);
  }

  return { open, downloadCsv };
}
