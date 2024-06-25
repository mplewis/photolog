import dayjs from "dayjs";
import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import type { OriginalMetadata, Photoset } from "../types";
import { YARL_THUMBNAIL_SIZE, fullSizes } from "../sizes";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

function trimSp(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function trimCommonPrefixWords(base: string, toTrim: string): string {
  const baseWords = base.split(" ");
  const toTrimWords = toTrim.split(" ");
  for (let i = 0; i < baseWords.length && i < toTrimWords.length; i++) {
    if (baseWords[i] !== toTrimWords[i]) return toTrimWords.slice(i).join(" ");
  }
  return toTrimWords.slice(baseWords.length).join(" ");
}

function prettyMeta(m: OriginalMetadata): {
  title: string;
  description: string;
} {
  const t: string[] = [];
  if (m.title) t.push(m.title);
  if (m.location) t.push(m.location);
  const title = t.join(", ");

  const camera = trimSp(`${m.cameraMake || ""} ${m.cameraModel || ""}`);
  let lens = trimSp(`${m.lensMake || ""} ${m.lensModel || ""}`);
  lens = trimCommonPrefixWords(camera, lens);

  const s: string[] = [];
  if (m.exposureTime) s.push(`${m.exposureTime}s`);
  if (m.fNumber) s.push(`f/${m.fNumber}`);
  if (m.iso) s.push(`ISO ${m.iso}`);
  const settings = s.join(", ");

  const d: string[] = [];
  if (camera) d.push(camera);
  if (lens) d.push(lens);
  if (settings) d.push(settings);
  const details = d.join(", ");

  if (!m.date) throw new Error(`Missing date for ${JSON.stringify(m)}`);

  const description = [
    // photoset.sizes[YARL_THUMBNAIL_SIZE].url,
    m.description && m.description + "\n",
    dayjs(m.date).format("dddd, MMMM D, YYYY"),
    details,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  return { title, description };
}

const Lightbox = ({
  photos,
  selectedPhoto,
  setSelectedPhoto,
}: {
  photos: Photoset[];
  selectedPhoto: number | null;
  setSelectedPhoto: (index: number | null) => void;
}) => {
  const slides: SlideImage[] = photos.map((photoset) => {
    if (!photoset.sizes[YARL_THUMBNAIL_SIZE])
      throw new Error(
        `Missing ${YARL_THUMBNAIL_SIZE} size for ${JSON.stringify(photoset)}`
      );

    const { title, description } = prettyMeta(photoset.metadata);

    const srcSet = fullSizes.map(({ size }) => {
      const src = photoset.sizes[size];
      if (!src)
        throw new Error(`Missing ${size} size for ${JSON.stringify(photoset)}`);
      return { src: src.url, width: src.width, height: src.height };
    });

    return {
      title,
      description,
      srcSet,
      src: photoset.sizes[YARL_THUMBNAIL_SIZE].url,
      width: photoset.sizes[YARL_THUMBNAIL_SIZE].width,
      height: photoset.sizes[YARL_THUMBNAIL_SIZE].height,
    };
  });

  return (
    <YARL
      plugins={[Captions, Thumbnails]}
      open={selectedPhoto !== null}
      close={() => setSelectedPhoto(null)}
      index={selectedPhoto ?? 0}
      slides={slides}
      carousel={{
        padding: 0,
      }}
      captions={{
        showToggle: true,
        descriptionMaxLines: 8,
        descriptionTextAlign: "center",
      }}
      thumbnails={{
        border: 0,
        showToggle: true,
        gap: 8,
        padding: 0,
        imageFit: "cover",
      }}
    />
  );
};

export default Lightbox;
