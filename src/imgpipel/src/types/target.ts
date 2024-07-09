import {stripIndents} from 'common-tags'
import {z} from 'zod'

export const targetDesc = stripIndents`
	Image generation target specifications, in the format \`name:quality:maxWidth:maxHeight\`, e.g. \`large:1.0:1920:1080\`.
	Values other than \`name\` can be omitted, e.g. \`thumb::100:100\`, \`full:1.0::\`',
`

const targetSchema = z.object({
  maxHeight: z.coerce.number().int().optional(),
  maxWidth: z.coerce.number().int().optional(),
  name: z.string(),
  quality: z.coerce.number(),
})
const targetRegex = /^(\w+):(\d+.\d+)?:(\d+)?:(\d+)?$/

/** A target image size/quality used to generate output images. */
export type Target = z.infer<typeof targetSchema>

/**
 * Parse a string defining a target into a Target (e.g. `large:1.0:1920:1080`).
 * @param raw The raw target string to parse
 * @param defaultQuality The default quality to use if none is provided
 * @returns The parsed target or an error message
 */
export function parseTarget(
  raw: string,
  defaultQuality: number,
): {error: string; success: false} | {success: true; target: Target} {
  const match = raw.match(targetRegex)
  if (!match) {
    return {
      error: `Invalid target \`${raw}\`: must match format \`name:quality:maxWidth:maxHeight\``,
      success: false,
    }
  }

  const [, name, quality, maxWidth, maxHeight] = match
  const values = {
    maxHeight: maxHeight || undefined,
    maxWidth: maxWidth || undefined,
    name,
    quality: quality || defaultQuality,
  }
  const parsed = targetSchema.safeParse(values)
  if (!parsed.success) return {error: `Invalid target \`${raw}\`: ${parsed.error.message}`, success: false}
  return {success: true, target: parsed.data}
}
