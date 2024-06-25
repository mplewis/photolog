import dayjs from "dayjs";
import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import type { OriginalMetadata, Photoset } from "../types";
import { YARL_THUMBNAIL_SIZE, fullSizes } from "../sizes";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// prettyMeta is kind of expensive, so let's only do it once per photoset
// TODO: We should really extract all this work to the Astro build stage
const prettyMetaCache: Record<number, { title: string; description: string }> =
  {};

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

function prettyMeta(
  index: number,
  m: OriginalMetadata
): {
  title: string;
  description: string;
} {
  if (prettyMetaCache[index]) return prettyMetaCache[index]!;

  const t: string[] = [];
  if (m.title) t.push(m.title);
  if (m.location) t.push(m.location);
  const title = t.join(", ");

  const camera = trimSp(`${m.cameraMake || ""} ${m.cameraModel || ""}`);
  let lens = trimSp(`${m.lensMake || ""} ${m.lensModel || ""}`);
  lens = trimCommonPrefixWords(camera, lens);
  // TODO: Prettify all lens names by using regex replace for [Ff𝑓]/?\d+(.\d+)?
  lens = lens.replaceAll("f/", "𝑓").replaceAll("F/", "𝑓");

  let lensAndFL = lens;
  if (lens && m.focalLength)
    lensAndFL = summarizeLensFocalLength(lens, m.focalLength);

  const s: string[] = [];
  if (m.exposureTime) s.push(`${m.exposureTime}s`);
  if (m.fNumber) {
    const fNum = parseFloat(m.fNumber);
    const match = lensSpecMatchesFNum(lens, fNum);
    console.log({ lens, fNum, match });
    if (!match) s.push(`𝑓${m.fNumber}`);
  }
  if (m.iso) s.push(`ISO ${m.iso}`);
  const settings = s.join(", ");

  const d: string[] = [];
  if (camera) d.push(camera);
  if (lensAndFL) d.push(lensAndFL);
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

  const result = { title, description };
  prettyMetaCache[index] = result;
  return result;
}

export function summarizeLensFocalLength(
  lens: string,
  focalLength: number
): string {
  const combined = `${lens} @ ${Math.round(focalLength)}mm`;

  // If the lens spec has a range, e.g. 16-80mm, always show focal length
  if (lens.match(/\d+-\d+mm/)) return combined;

  // Parse the prime focal length from the lens name
  const lensFLMatch = lens.match(/(\d+(.\d+)?)mm/);
  if (!lensFLMatch || !lensFLMatch[1]) return combined;
  const parsedFocalLength = parseFloat(lensFLMatch[1]);

  // If the lens spec matches the actual focal length, omit it
  const match = Math.abs(parsedFocalLength - focalLength) < 1.0;
  return match ? lens : combined;
}

export function lensSpecMatchesFNum(lens: string, fNum: number): boolean {
  const lensFNumMatches = lens.match(/[Ff𝑓]\/?(\d+(.\d+)?)/g);
  if (!lensFNumMatches) return false;
  const lastMatch = lensFNumMatches[lensFNumMatches.length - 1];
  if (!lastMatch) return false;
  const fnMatch = lastMatch.match(/\d+(.\d+)?/);
  if (!fnMatch) return false;
  const lensFNum = parseFloat(fnMatch[0]);

  return Math.abs(lensFNum - fNum) < 0.1;
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
  const slides: SlideImage[] = photos.map((photoset, i) => {
    if (!photoset.sizes[YARL_THUMBNAIL_SIZE])
      throw new Error(
        `Missing ${YARL_THUMBNAIL_SIZE} size for ${JSON.stringify(photoset)}`
      );

    const { title, description } = prettyMeta(i, photoset.metadata);

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
