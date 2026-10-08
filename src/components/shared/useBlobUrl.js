import { useState, useEffect } from "react";

// SameSite=Lax cookies are not sent in cross-site subframe loads, so PDFs
// load via blob URL (fetched with credentials). Top-level download links
// use the API URL directly — Lax cookies are sent on navigation.
// ponytail: fetch-per-modal, no cache; add a URL-keyed cache only if repeat views feel slow
export function useBlobUrl(url, mode) {
  const [blobUrl, setBlobUrl] = useState(null);
  useEffect(() => {
    if (mode !== "pdf" || !url) return;
    let objectUrl = null;
    let cancelled = false;
    fetch(url, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.blob();
      })
      .then((b) => {
        if (!cancelled) {
          objectUrl = URL.createObjectURL(b);
          setBlobUrl(objectUrl);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, mode]);
  return blobUrl;
}
