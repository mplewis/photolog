import envPaths from "env-paths";
import { existsSync } from "fs";
import { copyFile, mkdir, readFile } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { parse as parseYaml } from "yaml";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PATHS = envPaths("photolog");
const CONFIG_PATH = join(PATHS.config, "config.yaml");
const DEFAULT_CONFIG_PATH = join(__dirname, "fixtures", "default-config.yaml");

const configSchema = z.object({
  imageDir: z.string(),
  siteURL: z.string(),
  siteTitle: z.string(),
  siteDescription: z.string(),
  publicPathPrefix: z.string().optional().default("photos"),
  fileHashLen: z.number().optional().default(8),
  qualityButteraugli: z.number().optional().default(1.0),
});
export type Config = z.infer<typeof configSchema>;

export async function loadConfig(path = CONFIG_PATH): Promise<Config> {
  if (!existsSync(path)) {
    await mkdir(dirname(path), { recursive: true });
    await copyFile(DEFAULT_CONFIG_PATH, path);
    console.log(`Fresh config file created at ${path}`);
    console.log(`Please edit it to add your site details.`);
  }

  const raw = await readFile(path, "utf-8");
  const data = parseYaml(raw);
  const config = configSchema.parse(data);
  console.log(`Loaded config from ${path}`);
  return config;
}
