import dayjs from "dayjs";
import type { OriginalMetadata } from "../types";

const IGNORE_F_AT = 1.0; // Fujifilm reports f/1.0 for non-electronic lenses

interface Metadata
  extends Pick<
    OriginalMetadata,
    | "cameraMake"
    | "cameraModel"
    | "date"
    | "description"
    | "exposureTime"
    | "fNumber"
    | "focalLength"
    | "iso"
    | "lensMake"
    | "lensModel"
    | "location"
    | "title"
  > {}

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

export function describeMetadata(m: Metadata): {
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
  // TODO: Prettify all lens names by using regex replace for [Ff𝑓]/?\d+(.\d+)?
  lens = lens.replaceAll("f/", "𝑓").replaceAll("F/", "𝑓");

  let lensAndFL = lens;
  if (lens && m.focalLength)
    lensAndFL = summarizeLensFocalLength(lens, m.focalLength);

  const s: string[] = [];
  if (m.exposureTime) s.push(`${m.exposureTime}s`);
  if (m.fNumber) {
    const fNum = parseFloat(m.fNumber);
    if (fNum != IGNORE_F_AT) {
      const match = lensSpecMatchesFNum(lens, fNum);
      if (!match) s.push(`𝑓${m.fNumber}`);
    }
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

  return { title, description };
}
