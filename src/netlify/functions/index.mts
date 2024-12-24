import {
  AppBskyEmbedImages,
  AppBskyFeedPost,
  AtpAgent,
  BlobRef,
  RichText,
} from "@atproto/api";
import fetch from "node-fetch";
import shuffle from "knuth-shuffle-seeded";
import dayjs, { UnitType } from "dayjs";
import type { Config } from "@netlify/functions";
import type { PhotosData } from "../../sitegen/src/pages/photos.json.ts";

function env(key: string): string {
  const value = process.env[key];
  if (value === undefined) throw new Error(`Missing env var ${key}`);
  return value;
}

const ATP_SERVICE = "https://bsky.social";
const DATA_SOURCE = "https://photolog.mplewis.com/photos.json";
const BSKY_UPLOAD_SIZE_LIMIT = 1_000_000; // 1 MB
const NEW_PHOTO_INTERVAL: { count: number; unit: UnitType } = {
  count: 6,
  unit: "hours",
};

const BSKY_USERNAME = env("BSKY_USERNAME");
const BSKY_PASSWORD = env("BSKY_PASSWORD");

/** Fetch data for a selected image from Photolog. */
async function fetchImageData() {
  const resp = await fetch(DATA_SOURCE);
  const { basisDate, photos } = (await resp.json()) as PhotosData;
  const basisDateMs = new Date(basisDate).getTime();
  const shuffled = shuffle(photos, basisDateMs);
  const nSinceTotal = dayjs().diff(dayjs(basisDate), NEW_PHOTO_INTERVAL.unit);
  const nSince = Math.floor(nSinceTotal / NEW_PHOTO_INTERVAL.count);
  return shuffled[nSince % shuffled.length];
}

/** Select metadata for the largest image variant that is under the upload size limit. */
async function selectURL(
  sizes: { width: number; height: number; url: string }[]
): Promise<{ width: number; height: number; url: string }> {
  for (const size of sizes) {
    const resp = await fetch(size.url, { method: "HEAD" });
    const bytes = resp.headers.get("content-length");
    if (bytes && parseInt(bytes) <= BSKY_UPLOAD_SIZE_LIMIT) return size;
  }

  const tried = sizes.map((s) => s.url).join(", ");
  throw new Error(
    `No images were under the upload size limit. Tried: ${tried}`
  );
}

/** Upload an image from a URL to Bluesky. */
async function uploadImageFromURL(agent: AtpAgent, url: string) {
  const srcResp = await fetch(url);
  const imgAB = await srcResp.arrayBuffer();
  const imgU8 = new Uint8Array(imgAB);

  const dstResp = await agent.uploadBlob(imgU8);
  if (!dstResp.success) {
    console.log(dstResp);
    throw new Error("Failed to upload image");
  }
  return dstResp.data.blob;
}

/** Build the embed data for an image. */
function buildImageEmbed(
  imgBlob: BlobRef,
  width: number,
  height: number
): AppBskyEmbedImages.Main {
  const image = {
    image: imgBlob,
    aspectRatio: { width, height },
    alt: "",
  };
  return {
    $type: "app.bsky.embed.images",
    images: [image],
  };
}

/** Build the post data for an image. */
async function buildPost(
  agent: AtpAgent,
  rawText: string,
  imageEmbed: AppBskyEmbedImages.Main
): Promise<AppBskyFeedPost.Record> {
  const rt = new RichText({ text: rawText });
  await rt.detectFacets(agent);
  const { text, facets } = rt;
  return {
    text,
    facets,
    $type: "app.bsky.feed.post",
    createdAt: new Date().toISOString(),
    embed: imageEmbed,
  };
}

export default async () => {
  const agent = new AtpAgent({ service: ATP_SERVICE });
  await agent.login({ identifier: BSKY_USERNAME, password: BSKY_PASSWORD });

  const photo = await fetchImageData();
  const size = await selectURL(photo.sizes);
  console.log(size);

  if (process.env.DRY_RUN) {
    console.log("Dry run, skipping upload");
    return new Response("Dry run, skipping upload");
  }

  const blob = await uploadImageFromURL(agent, size.url);
  console.log(blob);

  const postData = await buildPost(
    agent,
    photo.desc,
    buildImageEmbed(blob, size.width, size.height)
  );
  console.log(postData);

  const postResp = await agent.post(postData);
  console.log(postResp);
  return new Response("OK");
};

export const config: Config = {
  schedule: "0 3,9,15,21 * * *", // MDT: 21:00, 03:00, 09:00, 15:00
  // schedule: "* * * * *", // every minute, for testing
};
