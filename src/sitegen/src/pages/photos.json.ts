import { readFile } from "fs/promises";
import type { MetadataReport } from "../common/types";
import dayjs from "dayjs";
import {
  parseCameraAndLens,
  parseExposure,
  parseLocalDate,
} from "../logic/desc";

const HOSTNAME = "https://photolog.mplewis.com";
const metadataPath = "../../tmp/metadata.json";

function smush(items: (string | false | undefined)[], joiner = " ") {
  return items.filter(Boolean).join(joiner);
}

function line(sym: string, s: string | undefined) {
  if (!s) return undefined;
  return `${sym} ${s}`;
}

const raw = (await readFile(metadataPath)).toString();
const metadata = JSON.parse(raw) as MetadataReport;
const fullPhotos = Object.entries(metadata.photos)
  .map(([, data]) => {
    const sizesLargestFirst = data.sizes.sort((a, b) => b.width - a.width);
    return {
      ...data,
      date: dayjs(data.date),
      urls: sizesLargestFirst.map((size) => `${HOSTNAME}/photos/${size.path}`),
    };
  })
  .sort((a, b) => (b.date.isBefore(a.date) ? -1 : 1));

const mostRecentPhoto = fullPhotos[0];
if (!mostRecentPhoto) throw new Error("No photos found");
const basisDate = mostRecentPhoto.date.toISOString();

const photos = fullPhotos.map((photo) => {
  const { title, description, urls } = photo;
  const { camera, lensAndFL } = parseCameraAndLens(photo);
  const date = line("📅", parseLocalDate(photo));
  const loc = line("📍", photo.location);
  const cam = line("📷", camera);
  const lens = line("🔎", smush(lensAndFL));
  const exp = line("☀️", smush(parseExposure(photo), ", "));
  const hashtags = [
    "photolog",
    camera?.toLowerCase().includes("fujifilm") && "fujifilm",
    camera?.toLowerCase().includes("iphone") && "shotoniphone",
  ]
    .filter(Boolean)
    .map((s) => `#${s}`)
    .join(" ");

  const desc = smush(
    [title, description, loc, date, cam, lens, exp, hashtags],
    "\n"
  );

  return { desc, urls };
});

const data = { basisDate, photos };
export type PhotosData = typeof data;

export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
