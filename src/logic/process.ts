import { glob } from "glob";
import { join, relative, resolve } from "path";
import { fastHashFiles, hashFileContents } from "./hash";
import { readMetadata, type Metadata } from "./metadata";
import { runConc } from "./conc";
import { SCREEN_SIZES, THUMBNAIL_MAX_WIDTH_PX } from "../sizes";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { z } from "zod";
import { readFile, unlink } from "fs/promises";
import { parse as yamlParse } from "yaml";
import { optimizeImage } from "./optimize";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..", "..");
const PUBLIC_DIR = join(PROJECT_ROOT, "public");

/** Length of hashes for filenames. Used to name content-addressed output JPG files. */
const FILE_HASH_LEN = 8;

/** Jpegli max butteraugli distance. Lower value = higher quality. 1.0 = visually lossless. */
const QUALITY_BUTTERAUGLI = 1.0;

/** Generated images are placed in this directory under `public/`. */
const PUBLIC_PATH_PREFIX = "photos";

/** A photo that has been processed by the image pipeline. */
export type Photo = {
  path: string;
  album: string | undefined;
  metadata: Metadata;
  sizes: {
    width: number;
    height: number;
    publicPath: string;
    thumbnail: boolean;
  }[];
};

const albumMetadataSchema = z.object({
  name: z.string(),
  desc: z.string(),
  order: z.number(),
});
/** Metadata for an album which groups photos together. */
export type AlbumMetadata = z.infer<typeof albumMetadataSchema>;
/** Full data for an album which groups photos together. */
export type Album = { key: string } & AlbumMetadata;

/** Fetch the required environment variable or crash if it's unset. */
function mustEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) throw new Error(`Missing environment variable: ${key}`);
  return value;
}

/** Discover album metadata inside directories, i.e. `tokyo/metadata.yaml`. */
async function discoverAlbums(
  srcDir: string
): Promise<Record<string, AlbumMetadata>> {
  const metadataPaths = await glob(join(srcDir, "*", "metadata.yaml"));
  const items = await runConc(
    "Read album metadata",
    metadataPaths.map((p) => async () => {
      const relPath = relative(srcDir, p);
      const key = relPath.split("/")[0];
      const raw = await readFile(p, "utf-8");
      const data = yamlParse(raw);
      return [key, albumMetadataSchema.parse(data)];
    })
  );
  return Object.fromEntries(items);
}

/** Print a report on which images were optimized in the most recent run. */
function printOptimReport(
  optimResults: {
    src: string;
    dst: string;
    result: Awaited<ReturnType<typeof optimizeImage>>;
  }[]
) {
  const optimUnskipped = optimResults.filter((r) => !r.result.skipped);
  const skipCount = optimResults.length - optimUnskipped.length;
  console.log(
    `Optimized ${optimUnskipped.length} images (${skipCount} skipped)`
  );
  for (const { src, dst, result } of optimUnskipped) {
    const { outSize, ratio, elapsed } = result;
    const ratioPct = (ratio * 100).toFixed(1);
    console.log(
      `  ${src} -> ${dst}: ${outSize} (${ratioPct}%) ${elapsed.toFixed(1)}s`
    );
  }
}

/** Delete files in the target directory that were not intended to exist from this run. */
async function deleteExtraneous(dir: string, desiredPaths: string[]) {
  const allFilesInDstDir = new Set(glob.sync(join(dir, "**", "*")));
  const filesToDelete = allFilesInDstDir.difference(new Set(desiredPaths));
  await runConc(
    "Delete extraneous files",
    Array.from(filesToDelete).map((p) => async () => unlink(p))
  );
  for (const p of filesToDelete) {
    console.log(`  ${p}`);
  }
}

/** Process all images, skipping any that have already been processed. */
async function _process(
  srcDir: string,
  dstDir: string,
  lastHash: string | null
): Promise<
  | { cacheFresh: true }
  | {
      cacheFresh: false;
      inputFilesHash: string;
      albums: Album[];
      photos: Photo[];
    }
> {
  const paths = glob
    .sync(join(srcDir, "**", "*.jpg"))
    .map((p) => ({ absPath: p, path: relative(srcDir, p) }));

  const inputFilesHash = await fastHashFiles(paths);
  if (lastHash === inputFilesHash) {
    return { cacheFresh: true };
  }

  const withMetadata = await runConc(
    "Read image metadata",
    paths.map((p) => async () => {
      const metadata = await readMetadata(p.absPath);
      return { ...p, metadata };
    })
  );

  const withHashes = await runConc(
    "Hash file contents",
    withMetadata.map((p) => async () => {
      const hash = await hashFileContents(p.absPath);
      return { ...p, hash: hash.slice(0, FILE_HASH_LEN) };
    })
  );

  // Add desired screen sizes to all images
  const withSizes = withHashes.map((p) => ({
    ...p,
    sizes: SCREEN_SIZES.map(({ width }) => {
      const name = `${p.hash}-${width}.jpg`;
      return {
        maxWidth: width,
        absPath: join(dstDir, name),
        publicPath: `/${PUBLIC_PATH_PREFIX}/${name}`,
        thumbnail: width <= THUMBNAIL_MAX_WIDTH_PX,
      };
    }),
  }));

  // Parse album metadata and categorize images by album
  const albums = await discoverAlbums(srcDir);
  const flatAlbums = Object.entries(albums).map(([key, value]) => ({
    key,
    ...value,
  }));
  const withAlbum = withSizes.map((p) => ({
    ...p,
    album: Object.keys(albums).find((a) => p.path.startsWith(`${a}/`)),
  }));

  // Build jobs for resizing and optimizing images
  const jobsArgs = withAlbum
    .map((p) =>
      p.sizes.map((s) => ({
        src: p.path,
        dst: s.publicPath,
        args: {
          src: p.absPath,
          dst: s.absPath,
          targetSize: { maxWidth: s.maxWidth },
          qualityButteraugli: QUALITY_BUTTERAUGLI,
        },
      }))
    )
    .flat();

  const optimResults = await runConc(
    "Resize and optimize images",
    jobsArgs.map(({ src, dst, args }) => async () => {
      const result = await optimizeImage(args);
      return { src, dst, result };
    })
  );
  printOptimReport(optimResults);

  // Add real dimensions to resized images
  const publicPathToDims = Object.fromEntries(
    optimResults.map((r) => [r.dst, r.result.dimensions])
  );
  const photos = withAlbum.map((p) => ({
    ...p,
    sizes: p.sizes.map((s) => {
      const dims = publicPathToDims[s.publicPath];
      if (!dims) throw new Error(`No dimensions found for ${s.publicPath}`);
      return { ...s, ...dims };
    }),
  }));

  const desiredFiles = photos.map((p) => p.sizes.map((s) => s.absPath)).flat();
  deleteExtraneous(dstDir, desiredFiles);

  // Sort photos by date descending
  photos.sort(
    (a, b) =>
      (b.metadata.date ?? new Date(0)).getTime() -
      (a.metadata.date ?? new Date(0)).getTime()
  );

  return { cacheFresh: false, inputFilesHash, photos, albums: flatAlbums };
}

/**
 * An asset pipeline that ensures all images have the required optimized variants.
 * Uses `SCREEN_SIZES` to determine which images to produce.
 *
 * Prefer use of the singleton to take advantage of app-widee caching:
 * ```
 * import { imagePipeline } from './process'
 * const { albums, photos } = imagePipeline.process()
 * ```
 */
export class ImagePipeline {
  srcDir: string;
  dstDir: string;
  cached:
    | {
        inputFilesHash: string;
        albums: Album[];
        photos: Photo[];
      }
    | undefined;

  constructor() {
    this.srcDir = mustEnv("PHOTOLOG_ORIGINALS_DIR");
    this.dstDir = resolve(join(PUBLIC_DIR, PUBLIC_PATH_PREFIX));
  }

  /** Process all images, skipping any that have already been processed.
   * If the pipeline has run recently, use the cached results if they're fresh. */
  async process(): Promise<{
    albums: Album[];
    photos: Photo[];
  }> {
    const result = await _process(
      this.srcDir,
      this.dstDir,
      this.cached?.inputFilesHash ?? null
    );
    if (result.cacheFresh) {
      if (!this.cached)
        throw new Error("Cache evaluated as fresh but no cached data found!");
      console.log("Cache is fresh, skipping processing");
      return this.cached;
    }

    this.cached = result;
    return this.cached;
  }
}

export const imagePipeline = new ImagePipeline();
