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

function describe(photo: PhotoData) {
  const { title, description } = photo;
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

  const lines = smush(
    [title, description, loc, date, cam, lens, exp, hashtags],
    "\n"
  );

  return lines;
}

const raw = (await readFile(metadataPath)).toString();
const metadata = JSON.parse(raw) as MetadataReport;
const photos = Object.entries(metadata.photos)
  .map(([, data]) => {
    const largest = data.sizes.reduce((largest, cand) =>
      cand.width > largest.width ? cand : largest
    );
    return {
      ...data,
      date: dayjs(data.date),
      url: `${HOSTNAME}/photos/${largest.path}`,
    };
  })
  .sort((a, b) => (b.date.isBefore(a.date) ? -1 : 1));
type PhotoData = (typeof photos)[0];

const mostRecentPhoto = photos[0];
if (!mostRecentPhoto) throw new Error("No photos found");
const { date: basisDate } = mostRecentPhoto;
const described = photos.map((photo) => ({
  desc: describe(photo),
  url: photo.url,
}));

const data = { basisDate, photos: described };
export type PhotosData = typeof data;

export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
