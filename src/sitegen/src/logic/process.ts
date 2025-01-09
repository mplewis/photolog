import { glob } from "glob";
import { join, relative } from "path";
import type { Photo } from "../types";
import { fastHashFiles } from "./hash";
import { readMetadata, type Metadata } from "./metadata";
import { runConc } from "./conc";

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
    const paths = glob
      .sync(join(this.origDir, "**", "*.jpg"))
      .map((p) => ({ absPath: p, path: relative(this.origDir, p) }));

    const inputFilesHash = await fastHashFiles(paths);
    if (this.cached?.inputFilesHash === inputFilesHash) {
      console.log("No changed images, skipping reprocessing");
      return this.cached.photos;
    }

    const photos = await runConc(
      "Read image metadata",
      paths.map((p) => async () => {
        const metadata = await readMetadata(p.absPath);
        return { ...p, metadata };
      })
    );

    console.dir(
      {
        // photos,
        inputFilesHash,
        origDir: this.origDir,
        cacheDir: this.cacheDir,
      },
      { depth: null }
    );
    this.cached = { inputFilesHash, photos };
    return this.cached.photos;
  }
}

export const imagePipeline = new ImagePipeline();
