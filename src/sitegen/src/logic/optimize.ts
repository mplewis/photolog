import { mkdir, stat } from "fs/promises";
import { dirname } from "path";
import * as tmp from "tmp-promise";
import { $ } from "zx";
import prettyBytes from "pretty-bytes";
import { existsSync } from "fs";

export type TargetSize =
  | { maxWidth: number }
  | { maxHeight: number }
  | { maxWidth: number; maxHeight: number };

export type OptimizeImageArgs = {
  src: string;
  dst: string;
  targetSize: TargetSize;
  /** Jpegli max butteraugli distance. Lower value = higher quality. 1.0 = visually lossless. */
  qualityButteraugli: number;
};

/**
 * Resize an image to fit within the target size with as little quality loss as possible.
 * @param src path to the source image
 * @param dst path to the destination image
 * @param targetSize the target size within which to fit the image
 */
async function resize(src: string, dst: string, targetSize: TargetSize) {
  let sizeParam: string;
  if ("maxWidth" in targetSize && "maxHeight" in targetSize) {
    sizeParam = `${targetSize.maxWidth}x${targetSize.maxHeight}>`;
  } else if ("maxWidth" in targetSize) {
    sizeParam = `${targetSize.maxWidth}>`;
  } else if ("maxHeight" in targetSize) {
    sizeParam = `x${targetSize.maxHeight}>`;
  } else {
    throw new Error("Must provide maxWidth, maxHeight, or both");
  }
  await $`magick ${src} -quality 100 -resize ${sizeParam} ${dst}`;
}

/**
 * Compress an image to the target visual quality.
 * @param src path to the source image
 * @param dst path to the destination image
 * @param qualityButteraugli Jpegli max butteraugli distance. Lower value = higher quality. 1.0 = visually lossless.
 */
async function compressToQuality(
  src: string,
  dst: string,
  qualityButteraugli: number
) {
  await $`cjpegli --distance=${qualityButteraugli} --chroma_subsampling=420 ${src} ${dst}`;
}

async function stripMetadata(path: string) {
  await $`exiftool -all= ${path}`;
}

/** Resize and compress an image to save bytes.　If the destination image already exists,
 * it is assumed to be the desired result image and processing is skipped. */
export async function optimizeImage(args: OptimizeImageArgs) {
  const { src, dst, targetSize, qualityButteraugli } = args;

  const start = Date.now();
  let skipped = true;
  if (!existsSync(dst)) {
    skipped = false;
    await mkdir(dirname(dst), { recursive: true });
    await tmp.withFile(async ({ path: resized }) => {
      await resize(src, resized, targetSize);
      await compressToQuality(resized, dst, qualityButteraugli);
    });
    await stripMetadata(dst);
  }

  const elapsed = (Date.now() - start) / 1000;
  const inBytes = (await stat(src)).size;
  const outBytes = (await stat(dst)).size;

  return {
    inBytes,
    outBytes,
    elapsed,
    skipped,
    outSize: prettyBytes(outBytes),
    ratio: outBytes / inBytes,
  };
}
