import { glob } from "glob";
import { join, relative } from "path";
import { fastHashFiles, hashFileContents } from "./hash";
import { readMetadata, type Metadata } from "./metadata";
import { runConc } from "./conc";

/** Length of hashes for filenames. Used to name content-addressed output JPG files. */
const FILE_HASH_LEN = 8;

type NewPhoto = {
  path: string;
  absPath: string;
  metadata: Metadata;
};

function mustEnv(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

async function _process(
  origDir: string,
  cacheDir: string,
  lastHash: string | null
): Promise<
  | { cacheFresh: true }
  | { cacheFresh: false; inputFilesHash: string; photos: NewPhoto[] }
> {
  const paths = glob
    .sync(join(origDir, "**", "*.jpg"))
    .map((p) => ({ absPath: p, path: relative(origDir, p) }));

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

  const photos = await runConc(
    "Hash file contents",
    withMetadata.map((p) => async () => {
      const hash = await hashFileContents(p.absPath);
      return { ...p, hash: hash.slice(0, FILE_HASH_LEN) };
    })
  );

  console.dir(
    {
      // photos,
      inputFilesHash,
      origDir,
      cacheDir,
    },
    { depth: null }
  );
  return { cacheFresh: false, inputFilesHash, photos };
}

export class ImagePipeline {
  origDir: string;
  cacheDir: string;
  cached:
    | {
        inputFilesHash: string;
        photos: NewPhoto[];
      }
    | undefined;

  constructor() {
    this.origDir = mustEnv("PHOTOLOG_ORIGINALS_DIR");
    this.cacheDir = mustEnv("PHOTOLOG_CACHE_DIR");
  }

  async process(): Promise<NewPhoto[]> {
    const result = await _process(
      this.origDir,
      this.cacheDir,
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
