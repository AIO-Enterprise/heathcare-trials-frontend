import { useState } from "react";
import { Film } from "lucide-react";
import CreativesViewer from "./CreativesViewer";

//   • Ad Creatives — images only (from output_files)
//   • Short Videos — shorts_files, plus any .mp4 that landed in output_files
function AdPreviewTabs({ ad }) {
  const isMp4 = (c) =>
    String(c?.image_url || "")
      .toLowerCase()
      .endsWith(".mp4");
  const allCreatives = ad.output_files || [];
  const images = allCreatives.filter((c) => !isMp4(c));
  const videos = [...allCreatives.filter(isMp4), ...(ad.shorts_files || [])];
  const hasImages = images.length > 0;
  const hasVideos = videos.length > 0;

  const [tab, setTab] = useState(hasImages ? "creatives" : "shorts");
  const active =
    tab === "shorts" ? (hasVideos ? "shorts" : "creatives") : hasImages ? "creatives" : "shorts";

  if (!hasImages && !hasVideos) return null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setTab("creatives")}
          className={active === "creatives" ? "filter-tab--active" : "filter-tab"}
        >
          Ad Creatives{hasImages ? ` (${images.length})` : ""}
        </button>
        {hasVideos && (
          <button
            onClick={() => setTab("shorts")}
            className={active === "shorts" ? "filter-tab--active" : "filter-tab"}
          >
            <Film size={12} style={{ marginRight: 4, verticalAlign: "middle" }} />
            Short Videos ({videos.length})
          </button>
        )}
      </div>

      {active === "creatives" ? (
        hasImages ? (
          <CreativesViewer creatives={images} />
        ) : (
          <p style={{ fontSize: "0.82rem", color: "var(--color-sidebar-text)" }}>
            No image creatives generated yet.
          </p>
        )
      ) : (
        <CreativesViewer creatives={videos} />
      )}
    </div>
  );
}

export default AdPreviewTabs;
