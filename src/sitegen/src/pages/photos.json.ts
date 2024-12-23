import { readFile } from "fs/promises";
import type { MetadataReport } from "../common/types";
import dayjs, { type UnitType } from "dayjs";
import shuffle from "knuth-shuffle-seeded";
import { parseExposure, parseLocalDate } from "../logic/desc";

const metadataPath = "../../tmp/metadata.json";

const NEW_PHOTO_EVERY: UnitType = "hour";

function smush(items: (string | false | undefined)[], joiner = " ") {
  return items.filter(Boolean).join(joiner);
}

function line(sym: string, s: string | undefined) {
  if (!s) return undefined;
  return `${sym} ${s}`;
}

const raw = (await readFile(metadataPath)).toString();
const metadata = JSON.parse(raw) as MetadataReport;
const photos = Object.entries(metadata.photos)
  .map(([path, data]) => ({
    ...data,
    date: dayjs(data.date),
    path,
  }))
  .sort((a, b) => {
    return b.date.get("milliseconds") - a.date.get("milliseconds");
  });

const mostRecentPhoto = photos[0];
if (!mostRecentPhoto) throw new Error("No photos found");
const seed = dayjs().diff(mostRecentPhoto.date, NEW_PHOTO_EVERY);
const shuffled = shuffle(photos, seed);
const photo = shuffled[139];
if (!photo) throw new Error("No photo selected");

const { title, description } = photo;
const date = line("📅", parseLocalDate(photo));
const loc = line("📍", photo.location);
const camera = line("📷", smush([photo.cameraMake, photo.cameraModel]));
const lens = line("🔎", smush([photo.lensMake, photo.lensModel]));
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
  [title, description, loc, date, camera, lens, exp, hashtags],
  "\n"
);

const { path } = photo.sizes.reduce((largest, cand) =>
  cand.width > largest.width ? cand : largest
);

export async function GET() {
  return new Response(JSON.stringify({ lines, path }), {
    headers: { "Content-Type": "application/json" },
  });
}
