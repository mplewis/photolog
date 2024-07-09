import {expect} from 'chai'
import {stripIndent} from 'common-tags'

import {parseExiftoolMetadata, toDate} from '../../src/lib/metadata.ts'

describe('toDate', () => {
  it('parses valid date values', () => {
    expect(toDate('2024:05:25 15:35:05', '-05:00')).to.deep.equal({
      date: new Date('2024-05-25T15:35:05-05:00'),
      localDate: [2024, 5, 25, 15, 35, 5],
      success: true,
    })
  })

  it('returns an error for invalid dto', () => {
    expect(toDate('some malformed data', '-05:00')).to.deep.equal({
      error: 'Could not parse DateTimeOriginal field',
      success: false,
    })
  })

  it('returns an error for invalid oto', () => {
    expect(toDate('2024:05:25 15:35:05', 'invalid offset')).to.deep.equal({
      error: 'Invalid date',
      success: false,
    })
  })
})

describe('parseExiftoolMetadata', () => {
  it('parses valid metadata', () => {
    // Sometimes Sub-location is truncated by Lightroom. Metadata field length issue? Prefer Location when longer.
    const raw = stripIndent`
      Make                            : FUJIFILM
      Model                           : X-T4
      LensInfo                        : 27mm f/2.8
      LensMake                        : FUJIFILM
      LensModel                       : XF27mmF2.8 R WR
      ExposureTime                    : 1/1000
      FNumber                         : 8.0
      FocalLength                     : 35.8 mm (35 mm equivalent: 54.0 mm)
      ISO                             : 1250
      DateTimeOriginal                : 2024:05:25 15:35:05
      OffsetTimeOriginal              : -05:00
      CameraProfile                   : Camera CLASSIC CHROME
      Location                        : Nauthólsvík Geothermal Beach, Reykjavík, Iceland
      Sub-location                    : Nauthólsvík Geothermal Beach,
      ImageWidth                      : 6000
      ImageHeight                     : 4000
      SomeAdditionalKey							  : SomeAdditionalValue
      AnotherUnusedKey							  : AnotherUnusedValue
    `
    expect(parseExiftoolMetadata(raw)).to.deep.equal({
      metadata: {
        cameraMake: 'FUJIFILM',
        cameraModel: 'X-T4',
        cameraProfile: 'Camera CLASSIC CHROME',
        date: new Date('2024-05-25T15:35:05-05:00'),
        description: undefined,
        exposureTime: '1/1000',
        fNumber: '8.0',
        focalLength: 35.8,
        height: 4000,
        iso: '1250',
        lensMake: 'FUJIFILM',
        lensModel: 'XF27mmF2.8 R WR',
        localDate: [2024, 5, 25, 15, 35, 5],
        location: 'Nauthólsvík Geothermal Beach, Reykjavík, Iceland',
        title: undefined,
        width: 6000,
      },
      success: true,
    })
  })

  it('returns an error for invalid metadata', () => {
    expect(parseExiftoolMetadata('some malformed data')).to.deep.equal({
      error: 'Could not parse metadata',
      success: false,
    })
  })
})
