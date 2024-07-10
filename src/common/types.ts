/** date in local time as [year, month, day, hour, minute, second] */
export type LocalDate = readonly [number, number, number, number, number, number]

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

/** Metadata for an input image which includes the resulting variant sizes. */
export type ResizedMetadata = Metadata & {
  date: Date
  albums: string[]
  sizes: ResizedImage[]
}

/** Metadata for a single variant resized image. */
export type ResizedImage = {
  path: string
  height: number
  width: number
}

/** Albums group photos. */
export type Album = {
  key: string
  name: string
  desc: string
}

/** The metadata report saved to a file after variant generation is complete. */
export type MetadataReport = {
  photos: Record<string, ResizedMetadata>
  albums: Album[]
}
