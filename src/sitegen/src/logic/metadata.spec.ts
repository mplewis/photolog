import { join } from "path";
import { readMetadata } from "./metadata";

describe("readMetadata", () => {
  it("parses the expected metadata from an image file", async () => {
    const data = await readMetadata(join(__dirname, "fixtures/nova.jpg"));
    expect(data).toMatchInlineSnapshot(`
      {
        "cameraMake": "FUJIFILM",
        "cameraModel": "X-T4",
        "cameraProfile": "Camera PROVIA/Standard",
        "date": 2024-11-27T18:09:10.000Z,
        "description": "Proxima Nova, the fluffy black cat, is covered in Christmas tree fluff",
        "exposureTime": "1/60",
        "fNumber": "2.8",
        "focalLength": 27,
        "height": 400,
        "iso": "1000",
        "lensMake": "FUJIFILM",
        "lensModel": "XF27mmF2.8 R WR",
        "localDate": [
          2024,
          11,
          27,
          12,
          9,
          10,
        ],
        "location": "Longmont, CO",
        "title": "Snowy Nova",
        "width": 400,
      }
    `);
  });
});
