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
const NEW_PHOTO_EVERY: UnitType = "day";
const UPLOAD_SIZE_LIMIT = 1_000_000; // Bluesky 1 MB limit

const BSKY_USERNAME = env("BSKY_USERNAME");
const BSKY_PASSWORD = env("BSKY_PASSWORD");

async function fetchImageData() {
  const resp = await fetch(DATA_SOURCE);
  const { basisDate, photos } = (await resp.json()) as PhotosData;
  const seed = dayjs().diff(dayjs(basisDate), NEW_PHOTO_EVERY);
  const shuffled = shuffle(photos, seed);
  return shuffled[0];
}

async function selectURL(
  sizes: { width: number; height: number; url: string }[]
): Promise<{ width: number; height: number; url: string }> {
  for (const size of sizes) {
    const resp = await fetch(size.url, { method: "HEAD" });
    const bytes = resp.headers.get("content-length");
    if (bytes && parseInt(bytes) <= UPLOAD_SIZE_LIMIT) return size;
  }

  const tried = sizes.map((s) => s.url).join(", ");
  throw new Error(
    `No images were under the upload size limit. Tried: ${tried}`
  );
}

async function uploadImageFromURL(agent: AtpAgent, url: string) {
  const srcResp = await fetch(url);
  const imgAB = await srcResp.arrayBuffer();
  const imgU8 = new Uint8Array(imgAB);

  const dstResp = await agent.uploadBlob(imgU8);
  if (!dstResp.success) {
    console.log(dstResp);
    throw new Error("Failed to upload image");
  }
  return dstResp;
}

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

  const imgUploadResp = await uploadImageFromURL(agent, size.url);
  console.log(imgUploadResp.data.blob);

  const record = await buildPost(
    agent,
    photo.desc,
    buildImageEmbed(imgUploadResp.data.blob, size.width, size.height)
  );
  console.log(record);

  const postResp = await agent.post(record);
  console.log(postResp);
  return new Response("OK");
};

export const config: Config = {
  schedule: "0 16 * * *", // 09:00 MST
  // schedule: "* * * * *", // for testing
};
