import {
  parseCameraAndLens,
  parseExposure,
  parseLocalDate,
} from "../logic/desc";
import { imagePipeline } from "../logic/process";

const HOSTNAME = "https://photolog.mplewis.com";
const BSKY_POST_LIMIT = 300 * 0.9; // 300 characters, with a buffer

/** Join string items together and omit the rest. */
function smush(items: (string | false | undefined)[], joiner = " ") {
  return items.filter(Boolean).join(joiner);
}

/** Prefix a string with a symbol. If the string does not exist, return nothing. */
function line(sym: string, s: string | undefined) {
  if (!s) return undefined;
  return `${sym} ${s}`;
}

const { photos: processedPhotos } = await imagePipeline.process();

const fullPhotos = processedPhotos.map((p) => {
  const sizesLargestFirst = p.sizes.sort((a, b) => b.width - a.width);
  return {
    ...p,
    date: p.metadata.date,
    sizes: sizesLargestFirst.map(({ width, height, publicPath }) => ({
      width,
      height,
      url: `${HOSTNAME}${publicPath}`,
    })),
  };
});

const mostRecentPhoto = fullPhotos[0];
if (!mostRecentPhoto) throw new Error("No photos found");
if (!mostRecentPhoto.date)
  throw new Error(`Missing date for ${mostRecentPhoto.path}`);
const basisDate = mostRecentPhoto.date.toISOString();

const photos = fullPhotos.map((photo) => {
  const { metadata } = photo;
  const { title, description } = metadata;
  const { sizes } = photo;
  const { camera, lensAndFL } = parseCameraAndLens(metadata);
  const date = line("📅", parseLocalDate(metadata));
  const loc = line("📍", metadata.location);
  const cam = line("📷", camera);
  const lens = line("🔎", smush(lensAndFL));
  const exp = line("☀️", smush(parseExposure(metadata), ", "));
  const hashtags = [
    "photolog",
    camera?.toLowerCase().includes("fujifilm") && "fujifilm",
    camera?.toLowerCase().includes("iphone") && "shotoniphone",
  ]
    .filter(Boolean)
    .map((s) => `#${s}`)
    .join(" ");

  let desc = smush(
    [title, description, loc, date, cam, lens, exp, hashtags],
    "\n"
  );
  if (desc.length > BSKY_POST_LIMIT)
    desc = smush([title, loc, date, cam, lens, exp, hashtags], "\n");

  return { desc, sizes };
});

const data = { basisDate, photos };
export type PhotosData = typeof data;

export async function GET() {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
}
