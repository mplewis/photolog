import { glob } from "glob";
import { join, relative, resolve } from "path";
import { fastHashFiles, hashFileContents } from "./hash";
import { readMetadata, type Metadata } from "./metadata";
import { runConc } from "./conc";
import { screenSizes } from "../sizes";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { z } from "zod";
import { readFile } from "fs/promises";
import { parse as yamlParse } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = join(__dirname, "..", "..", "..", "..");
const PUBLIC_DIR = join(PROJECT_ROOT, "public");

/** Length of hashes for filenames. Used to name content-addressed output JPG files. */
const FILE_HASH_LEN = 8;

type NewPhoto = {
  path: string;
  absPath: string;
  metadata: Metadata;
};

const albumMetadataSchema = z.object({
  name: z.string(),
  desc: z.string(),
  order: z.number(),
});
export type AlbumMetadata = z.infer<typeof albumMetadataSchema>;

function mustEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

async function discoverAlbums(
  srcDir: string
): Promise<Record<string, AlbumMetadata>> {
  const metadataPaths = await glob(join(srcDir, "*", "metadata.yaml"));
  console.log(metadataPaths);
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

async function _process(
  publicPathPrefix: string,
  srcDir: string,
  dstDir: string,
  lastHash: string | null
): Promise<
  | { cacheFresh: true }
  | { cacheFresh: false; inputFilesHash: string; photos: NewPhoto[] }
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

  const photos = withHashes.map((p) => ({
    ...p,
    sizes: screenSizes.map(({ width }) => {
      const name = `${p.hash}-${width}.jpg`;
      return {
        width,
        absPath: join(dstDir, name),
        publicPath: `/${publicPathPrefix}/${name}`,
      };
    }),
  }));

  // TODO: Delete all extraneous files in this dir
  const allDstPaths = photos.map((p) => p.sizes.map((s) => s.absPath)).flat();

  const albums = await discoverAlbums(srcDir);

  console.dir(
    {
      // photos,
      albums,
      inputFilesHash,
      srcDir,
      dstDir,
    },
    { depth: null }
  );
  return { cacheFresh: false, inputFilesHash, photos };
}

export class ImagePipeline {
  publicPathPrefix: string;
  srcDir: string;
  dstDir: string;
  cached:
    | {
        inputFilesHash: string;
        photos: NewPhoto[];
      }
    | undefined;

  constructor() {
    this.publicPathPrefix = mustEnv("PHOTOLOG_PUBLIC_SUBDIR_NAME");
    this.srcDir = mustEnv("PHOTOLOG_ORIGINALS_DIR");
    this.dstDir = resolve(join(PUBLIC_DIR, this.publicPathPrefix));
  }

  async process(): Promise<NewPhoto[]> {
    const result = await _process(
      this.publicPathPrefix,
      this.srcDir,
      this.dstDir,
      this.cached?.inputFilesHash ?? null
    );
    if (result.cacheFresh) {
      if (!this.cached)
        throw new Error("Cache evaluated as fresh but no cached data found!");
      console.log("Cache is fresh, skipping processing");
      return this.cached.photos;
    }

    this.cached = result;
    return this.cached.photos;
  }
}

export const imagePipeline = new ImagePipeline();
