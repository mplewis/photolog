import dayjs from "dayjs";
import type { LocalDate, ResizedMetadata } from "../common/types";

const CAPTION_MAX_LEN = 40; // Fits within iPhone Mini screen width
const IGNORE_F_AT = 1.0; // Fujifilm reports f/1.0 for non-electronic lenses
const PROFILE_RE = /^Camera (.+)$/; // Match Fujifilm "Camera CLASSIC CHROME" and ignore others

interface Metadata
  extends Pick<
    ResizedMetadata,
    | "cameraMake"
    | "cameraModel"
    | "cameraProfile"
    | "date"
    | "description"
    | "exposureTime"
    | "fNumber"
    | "focalLength"
    | "iso"
    | "lensMake"
    | "lensModel"
    | "localDate"
    | "location"
    | "title"
  > {}

/** Replace all instances of 2+ spaces with 1 space. */
function trimSp(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** For two strings of space-delineated words, return `toTrim` without any shared prefix words from `base`. */
function trimCommonPrefixWords(base: string, toTrim: string): string {
  const baseWords = base.split(" ");
  const toTrimWords = toTrim.split(" ");
  for (let i = 0; i < baseWords.length && i < toTrimWords.length; i++) {
    if (baseWords[i] !== toTrimWords[i]) return toTrimWords.slice(i).join(" ");
  }
  return toTrimWords.slice(baseWords.length).join(" ");
}

/** Summarize a lens and focal length, omitting the focal length if it is equal to the prime lens length. */
export function summarizeLensFocalLength(
  lens: string,
  focalLength: number
): string[] {
  const combined = [lens, `${Math.round(focalLength)}mm`];

  // If the lens spec has a range, e.g. 16-80mm, always show focal length
  if (lens.match(/\d+-\d+mm/)) return combined;

  // Parse the prime focal length from the lens name
  const lensFLMatch = lens.match(/(\d+(.\d+)?)mm/);
  if (!lensFLMatch || !lensFLMatch[1]) return combined;
  const parsedFocalLength = parseFloat(lensFLMatch[1]);

  // If the lens spec matches the actual focal length, omit it
  const match = Math.abs(parsedFocalLength - focalLength) < 1.0;
  return match ? [lens] : combined;
}

/** True if the lens spec contains the given focal length, false otherwise. */
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

/** Convert a set of indivisible chunks into a series of lines fitting within `maxLen` cols, joined by `sep`. */
export function chunksToLines(
  maxLen: number,
  chunks: string[],
  sep = ", "
): string[] {
  const chunkC = chunks.length;
  const chunksL = chunks.map((c) => c.length);
  const sepL = sep.length;

  // Step 1: Find the min # of lines required, greedily
  const lineL: number[] = [chunksL[0] ?? 0];
  let lineIdx = 0;
  for (let i = 1; i < chunksL.length; i++) {
    const chunkL = chunksL[i]!;
    if (lineL[lineIdx]! + sepL + chunkL <= maxLen) {
      lineL[lineIdx]! += sepL + chunkL;
    } else {
      lineIdx++;
      lineL[lineIdx] = chunkL;
    }
  }
  const greedyLC = lineL.length;
  const sepC = greedyLC - 1;

  // Step 2: Permute separators
  function generatePermutationIndices(items: number, separators: number) {
    const permutations: number[][] = [];
    function gen(current: number[], start: number): void {
      if (current.length === separators) {
        permutations.push(current.slice()); // Add a copy of current permutation
        return;
      }
      for (let i = start; i < items; i++) {
        current.push(i);
        gen(current, i + 1);
        current.pop();
      }
      return;
    }
    gen([], 0);
    return permutations;
  }

  const perms = generatePermutationIndices(chunkC, sepC);

  // Step 3: Evaluate permutations
  function evalLines(average: number, lengths: number[]): number {
    // Calculate the sum of the squares of the differences
    let sum = 0;
    for (const l of lengths) {
      sum += Math.pow(average - l, 2);
    }
    return sum;
  }

  const avgLineL = lineL.reduce((a, b) => a + b, 0) / lineL.length;
  const best = { score: Infinity, perm: [-1], nonCompliantLineCount: Infinity };

  for (let permI = 0; permI < perms.length; permI++) {
    const perm = perms[permI]!;
    const linesL: number[] = [];
    let currLineL = 0;
    for (let chunkI = 0; chunkI < chunks.length; chunkI++) {
      currLineL += chunksL[chunkI]!;
      if (perm!.includes(chunkI)) {
        linesL.push(currLineL);
        currLineL = 0;
      } else {
        currLineL += sepL;
      }
    }
    currLineL -= sepL;
    linesL.push(currLineL);

    const score = evalLines(avgLineL, linesL);
    if (score < best.score) {
      const nonCompliantLineCount = linesL.filter((l) => l > maxLen).length;
      if (
        score < best.score &&
        nonCompliantLineCount <= best.nonCompliantLineCount
      ) {
        best.score = score;
        best.perm = perm;
        best.nonCompliantLineCount = nonCompliantLineCount;
      }
    }
  }

  // Step 4: Reconstruct lines
  const lines: string[] = [];
  let line: string[] = [];
  for (let i = 0; i < chunks.length; i++) {
    line.push(chunks[i]!);
    if (best.perm.includes(i)) {
      lines.push(line.join(sep));
      line = [];
    }
  }
  lines.push(line.join(sep));
  return lines;
}

/** Parse a `Camera SOME PROFILE => SOME PROFILE` value from Fujifilm `CameraProfile` metadata. */
function parseCameraProfile(profile?: string): string | null {
  if (!profile) return null;
  const match = profile.match(PROFILE_RE);
  return (match && match[1]) ?? null;
}

/** Parse exposure values (exposure time, F stop, ISO) from metadata. */
export function parseExposure(
  m: Pick<Metadata, "exposureTime" | "fNumber" | "iso" | "lensModel">
): string[] {
  const s: string[] = [];
  if (m.exposureTime) s.push(`${m.exposureTime}s`);
  if (m.fNumber) {
    const fNum = parseFloat(m.fNumber);
    if (fNum != IGNORE_F_AT) {
      const match = lensSpecMatchesFNum(m.lensModel || "", fNum);
      if (!match) s.push(`𝑓${m.fNumber}`);
    }
  }
  if (m.iso) s.push(`ISO ${m.iso}`);
  return s;
}

/** Parse a photo's locally-taken date from metadata. */
export function parseLocalDate(m: Pick<Metadata, "localDate">) {
  if (!m.localDate) return undefined;
  const [y, mo, d, h, mi, s] = m.localDate;
  const parsed = dayjs(`${y}-${mo}-${d} ${h}:${mi}:${s}`);
  return parsed.format("ddd MMM D HH:mm");
}

/** Summarize a set of camera metadata into a photo title and description. */
export function describeMetadata(m: Metadata): {
  title?: string | undefined;
  description: string;
} {
  if (!m.date) throw new Error(`Missing date for ${JSON.stringify(m)}`);

  const camera = trimSp(`${m.cameraMake || ""} ${m.cameraModel || ""}`);
  let lens = trimSp(`${m.lensMake || ""} ${m.lensModel || ""}`);
  lens = trimCommonPrefixWords(camera, lens);
  // TODO: Prettify all lens names by using regex replace for [Ff𝑓]/?\d+(.\d+)?
  lens = lens.replaceAll("f/", "𝑓").replaceAll("F/", "𝑓");

  // Summarize lens and focal length
  let lensAndFL = [lens];
  if (lens && m.focalLength)
    lensAndFL = summarizeLensFocalLength(lens, m.focalLength);

  const profile = parseCameraProfile(m.cameraProfile);

  // Combine details into desc chunks, then layout into lines
  const d: (string | null | undefined)[] = [
    parseLocalDate(m),
    m.location,
    camera,
    ...lensAndFL,
    parseExposure(m).join(", "),
    profile && `Profile: ${profile}`,
  ];
  const dx = d.filter(Boolean) as string[];
  const details = chunksToLines(CAPTION_MAX_LEN, dx).join("\n");

  // Build final description
  const description = [details, m.description]
    .filter(Boolean)
    .join("\n")
    .trim();

  return { title: m.title, description };
}
