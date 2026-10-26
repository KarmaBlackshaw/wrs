import { ApiError } from "@/lib/http";
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
  const toast = useToast();

  function reportFailure(caught: unknown) {
    toast.show(caught instanceof ApiError ? caught.message : "Couldn't download the file.", "error");
  }

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
      reportFailure(caught);
    }
  }

  async function download(fetchFile: () => Promise<Blob>, filename: string) {
    try {
      const blob = await fetchFile();

      clickDownload(toObjectUrl(blob), filename);
    } catch (caught) {
      reportFailure(caught);
    }
  }

  return { open, download };
}
