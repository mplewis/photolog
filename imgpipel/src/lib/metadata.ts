import {z} from 'zod'
import {$} from 'zx'

/** date in local time as [year, month, day, hour, minute, second] */
type LocalDate = readonly [number, number, number, number, number, number]

/** Metadata gathered from an image. */
export type Metadata = {
  cameraMake?: string
  cameraModel?: string
  cameraProfile?: string
  date?: Date
  description?: string
  exposureTime?: string
  fNumber?: string
  focalLength?: number
  height: number
  iso?: string
  lensMake?: string
  lensModel?: string
  localDate?: LocalDate
  location?: string
  title?: string
  width: number
}

/*
Example exiftool output:

exiftool -s <flags> some-file.jpg

CameraProfile                   : Camera CLASSIC CHROME
Caption-Abstract                : Some longer description of this photo
DateTimeOriginal                : 2024:05:25 15:35:05
ExposureTime                    : 1/1000
FNumber                         : 8.0
FocalLength                     : 35.8 mm (35 mm equivalent: 54.0 mm)
ImageHeight                     : 3980
ImageWidth                      : 5970
ISO                             : 1250
LensInfo                        : 27mm f/2.8
LensMake                        : FUJIFILM
LensModel                       : XF27mmF2.8 R WR
Make                            : FUJIFILM
Model                           : X-T4
ObjectName                      : Some brief title for this photo
OffsetTimeOriginal              : -05:00
Sub-location                    : Some human-written location description
*/

/** Regex to parse exiftool output lines. */
const metadataRe = /^([\w-_\s]+)\s*:\s(.+)$/

const etFlags = [
  '-CameraProfile',
  '-Caption-Abstract',
  '-DateTimeOriginal',
  '-ExposureTime',
  '-FNumber',
  '-FocalLength',
  '-ImageHeight',
  '-ImageWidth',
  '-ISO',
  '-LensInfo',
  '-LensMake',
  '-LensModel',
  '-Location',
  '-Make',
  '-Model',
  '-ObjectName',
  '-OffsetTimeOriginal',
  '-Sub-location',
]

/** Schema to gather metadata key/values from raw exiftool output. */
const metadataSchema = z.object({
  CameraProfile: z.string().optional(),
  CaptionAbstract: z.string().optional(),
  DateTimeOriginal: z.string().optional(),
  ExposureTime: z.string().optional(),
  FNumber: z.string().optional(),
  FocalLength: z.string().optional(),
  ISO: z.string().optional(),
  ImageHeight: z.coerce.number().int(),
  ImageWidth: z.coerce.number().int(),
  LensInfo: z.string().optional(),
  LensMake: z.string().optional(),
  LensModel: z.string().optional(),
  Location: z.string().optional(),
  Make: z.string().optional(),
  Model: z.string().optional(),
  ObjectName: z.string().optional(),
  OffsetTimeOriginal: z.string().optional(),
  Sublocation: z.string().optional(),
})

/**
 * Convert a DateTimeOriginal and OffsetTimeOriginal to a Date.
 * @param dto DateTimeOriginal field from EXIF data
 * @param oto OffsetTimeOriginal field from EXIF data
 * @returns Date if successful, error message if not
 */
export function toDate(
  dto: string,
  oto: string = 'Z',
): {date: Date; localDate: LocalDate; success: true} | {error: string; success: false} {
  const dtoRe = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})$/

  const dtoMatch = dto.match(dtoRe)
  if (!dtoMatch) return {error: 'Could not parse DateTimeOriginal field', success: false}

  const [, year, month, day, hour, minute, second] = dtoMatch
  const ot = oto === '00:00' ? 'Z' : oto

  const iso8601 = `${year}-${month}-${day}T${hour}:${minute}:${second}${ot}`
  const date = new Date(iso8601)
  if (Number.isNaN(date.getTime())) return {error: 'Invalid date', success: false}
  const localDate = [
    Number.parseInt(year, 10),
    Number.parseInt(month, 10),
    Number.parseInt(day, 10),
    Number.parseInt(hour, 10),
    Number.parseInt(minute, 10),
    Number.parseInt(second, 10),
  ] as const
  return {date, localDate, success: true}
}

/**
 * Parse exiftool raw output into a Metadata object.
 * @param raw The raw output from exiftool
 * @returns Metadata object on success, error message otherwise
 */
export function parseExiftoolMetadata(
  raw: string,
): {error: string; success: false} | {metadata: Metadata; success: true} {
  const lines = raw.split('\n')
  const kv: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(metadataRe)
    if (!match) continue
    const [, key, value] = match
    const k = key.replaceAll(/[ -]/g, '') // make keys consistent
    kv[k] = value
  }

  if (Object.keys(kv).length === 0) return {error: 'Could not parse metadata', success: false}

  const result = metadataSchema.safeParse(kv)
  if (!result.success) return {error: `Failed to validate metadata: ${result.error.message}`, success: false}
  const {data} = result

  let date: Date | undefined
  let localDate: LocalDate | undefined
  if (data.DateTimeOriginal) {
    const r = toDate(data.DateTimeOriginal, data.OffsetTimeOriginal)
    if (r.success) {
      date = r.date
      localDate = r.localDate
    } else {
      console.warn(`Error parsing date from ${data.DateTimeOriginal}, ${data.OffsetTimeOriginal}: ${r.error}`)
    }
  }

  let location = data.Location || data.Sublocation
  if (data.Location && data.Sublocation && data.Sublocation.length > data.Location.length) {
    location = data.Sublocation
  }

  let focalLength: number | undefined
  if (data.FocalLength) {
    const focalLengthMatch = data.FocalLength.match(/^([\d.]+) mm/)
    if (focalLengthMatch) focalLength = Number.parseFloat(focalLengthMatch[1])
  }

  const metadata = {
    cameraMake: data.Make,
    cameraModel: data.Model,
    cameraProfile: data.CameraProfile,
    date,
    description: data.CaptionAbstract,
    exposureTime: data.ExposureTime,
    fNumber: data.FNumber,
    focalLength,
    height: data.ImageHeight,
    iso: data.ISO,
    lensMake: data.LensMake,
    lensModel: data.LensModel,
    localDate,
    location,
    title: data.ObjectName,
    width: data.ImageWidth,
  }
  return {metadata, success: true}
}

/**
 * Read metadata from an image file.
 * @param inPath Path to the image file
 * @returns Metadata on success, error message otherwise
 */
export async function readMetadata(
  inPath: string,
): Promise<{error: string; success: false} | {metadata: Metadata; success: true}> {
  $.quiet = true

  const raw = await $`exiftool -s ${etFlags} ${inPath}`
  const parseResult = parseExiftoolMetadata(raw.stdout)
  if (!parseResult.success)
    return {error: `Error parsing metadata from ${inPath}: ${parseResult.error}`, success: false}

  return {metadata: parseResult.metadata, success: true}
}
