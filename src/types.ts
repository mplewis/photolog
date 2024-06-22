import { z } from "zod";

export const metadataPackageSchema = z.object({
  processed: z.record(
    z.object({
      original: z.string(),
      height: z.number(),
      width: z.number(),
    })
  ),
  original: z.record(
    z.object({
      cameraMake: z.string().optional(),
      cameraModel: z.string().optional(),
      date: z.coerce.date().optional(),
      exposureTime: z.string().optional(),
      fNumber: z.string().optional(),
      height: z.number(),
      iso: z.string().optional(),
      lensMake: z.string().optional(),
      lensModel: z.string().optional(),
      width: z.number(),
    })
  ),
});

export type MetadataPackage = z.infer<typeof metadataPackageSchema>;
export type OriginalMetadata = MetadataPackage["original"]["_value"];
export type ProcessedMetadata = MetadataPackage["processed"]["_value"];
