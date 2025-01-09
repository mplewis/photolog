// @ts-expect-error
import convertBase from "bigint-base-converter";
import { runConc } from "./conc";
import { stat } from "fs/promises";

const BASE36 = "0123456789abcdefghijklmnopqrstuvwxyz";

// https://github.com/creationix/b36/blob/master/b36.js
export function encodeB36(buf: Buffer): string {
  return convertBase([].slice.call(buf), 256, BASE36);
}

/**
 * Hash a string using SHA-256 and return the result as a base36 string.
 * @param s The string data to hash
 * @returns a base36 string representation of the SHA-256 hash of the input string
 */
export async function hashB36(s: string): Promise<string> {
  const data = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return encodeB36(Buffer.from(hash));
}

/** Generate a base36 hash for the given attributes of a set of items. */
function hashManyB36<T>(
  items: T[],
  attrs: (item: T) => any[]
): Promise<string> {
  const rows = items.map((x) =>
    attrs(x)
      .map((a) => a.toString())
      .join(":")
  );
  return hashB36(rows.sort().join("\n"));
}

/** Generate a deterministic hash very quickly for a set of files based on file sizes and modification times. */
export async function fastHashFiles(
  paths: { absPath: string; path: string }[]
): Promise<string> {
  const withStats = await runConc(
    "Checking for changed images",
    paths.map((p) => async () => {
      const s = await stat(p.absPath);
      return { ...p, size: s.size, mtime: s.mtime };
    })
  );
  return hashManyB36(withStats, (p) => [p.path, p.size, p.mtime.getTime()]);
}
