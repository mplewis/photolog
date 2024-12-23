import {
  AppBskyEmbedImages,
  AppBskyFeedPost,
  AtpAgent,
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

export default async () => {
  const agent = new AtpAgent({ service: ATP_SERVICE });
  await agent.login({ identifier: BSKY_USERNAME, password: BSKY_PASSWORD });

  const resp = await fetch(DATA_SOURCE);
  const { basisDate, photos } = (await resp.json()) as PhotosData;
  const seed = dayjs().diff(dayjs(basisDate), NEW_PHOTO_EVERY);
  const shuffled = shuffle(photos, seed);
  const photo = shuffled[0];

  const size = await selectURL(photo.sizes);
  console.log(size);
  const imgResp = await fetch(size.url);
  const imgAB = await imgResp.arrayBuffer();
  const imgU8 = new Uint8Array(imgAB);
  const imgUploadResp = await agent.uploadBlob(imgU8);
  if (!imgUploadResp.success) {
    console.log(imgUploadResp);
    throw new Error("Failed to upload image");
  }
  console.log(imgUploadResp.data.blob);

  const image = {
    image: imgUploadResp.data.blob,
    aspectRatio: { width: size.width, height: size.height },
    alt: "",
  };
  const embed: AppBskyEmbedImages.Main = {
    $type: "app.bsky.embed.images",
    images: [image],
  };

  const rt = new RichText({ text: photo.desc });
  await rt.detectFacets(agent);
  const record: AppBskyFeedPost.Record = {
    $type: "app.bsky.feed.post",
    createdAt: new Date().toISOString(),
    text: rt.text,
    facets: rt.facets,
    embed,
  };
  console.log(record);

  const postResp = await agent.post(record);
  console.log(postResp);
  return new Response("OK");
};

export const config: Config = {
  schedule: "0 16 * * *", // 09:00 MST
  // schedule: "* * * * *", // for testing
};
