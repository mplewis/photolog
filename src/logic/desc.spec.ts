import {
  chunksToLines,
  lensSpecMatchesFNum,
  summarizeLensFocalLength,
} from "./desc";

describe("summarizeLensFocalLength", () => {
  const cases = [
    ["XF16-80mmF4 R OIS WR", 16, ["XF16-80mmF4 R OIS WR", "16mm"]],
    ["XF16-80mmF4 R OIS WR", 35.8, ["XF16-80mmF4 R OIS WR", "36mm"]],
    ["XF27mmF2.8 R WR", 27, ["XF27mmF2.8 R WR"]],
    ["12mm Rokinon", 12, ["12mm Rokinon"]],
    ["35mm Disposable", 35, ["35mm Disposable"]],
    [
      "back triple camera 1.54mm f/2.4",
      1.5,
      ["back triple camera 1.54mm f/2.4"],
    ],
    ["Nikkor AF 50mm f/1.8D", 50, ["Nikkor AF 50mm f/1.8D"]],
  ] as const;

  for (const [lens, focalLength, summary] of cases) {
    it(`returns the expected value for ${lens} @ ${focalLength}mm`, () => {
      expect(summarizeLensFocalLength(lens, focalLength)).toEqual(summary);
    });
  }
});

describe("lensSpecMatchesFNum", () => {
  const cases = [
    ["back triple camera 1.54mm 𝑓2.4", 2.4, true],
    ["back triple camera 6.86mm 𝑓1.78", 1.8, true],
    ["XF27mmF2.8 R WR", 2.8, true],
    ["XF27mmF2.8 R WR", 8.0, false],
  ] as const;

  for (const [lens, fNum, expected] of cases) {
    it(`returns the expected value for ${lens} @ 𝑓${fNum}`, () => {
      const actual = lensSpecMatchesFNum(lens, fNum);
      expect(actual).toEqual(expected);
    });
  }
});

describe("chunksToLines", () => {
  it("splits long lines as expected", () => {
    const cameraBits = [
      "FUJIFILM X-T4",
      "XF16-80mmF4 R OIS WR",
      "47mm",
      "1/480s",
      "ISO 320",
      "CLASSIC CHROME",
    ];
    expect(chunksToLines(40, cameraBits)).toMatchInlineSnapshot(`
      [
        "FUJIFILM X-T4, XF16-80mmF4 R OIS WR",
        "47mm, 1/480s, ISO 320, CLASSIC CHROME",
      ]
    `);

    expect(chunksToLines(30, cameraBits)).toMatchInlineSnapshot(`
      [
        "FUJIFILM X-T4",
        "XF16-80mmF4 R OIS WR",
        "47mm, 1/480s, ISO 320",
        "CLASSIC CHROME",
      ]
    `);

    const prose = `call me ishmael some years ago never mind how long precisely having little or no money in my purse and nothing particular to interest me on shore i thought i would sail about a little`;
    expect(chunksToLines(40, prose.split(" "), " ")).toMatchInlineSnapshot(`
      [
        "call me ishmael some years ago never",
        "mind how long precisely having little",
        "or no money in my purse and nothing",
        "particular to interest me on shore i",
        "thought i would sail about a little",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Thu Apr 25 15:05",
        "Longmont, CO",
        "FUJIFILM X-T4",
        "16mm Izukar",
        "1/800s, ISO 800",
        "Profile: CLASSIC CHROME",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Thu Apr 25 15:05, Longmont, CO",
        "FUJIFILM X-T4, 16mm Izukar",
        "1/800s, ISO 800, Profile: CLASSIC CHROME",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Thu May 2 10:02",
        "Longmont, CO",
        "FUJIFILM X-T4",
        "XF27mmF2.8 R WR",
        "1/2000s, ISO 320",
        "Profile: Velvia/Vivid",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Thu May 2 10:02, Longmont, CO",
        "FUJIFILM X-T4, XF27mmF2.8 R WR",
        "1/2000s, ISO 320, Profile: Velvia/Vivid",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Thu Apr 25 15:05",
        "Longmont, CO",
        "FUJIFILM X-T4",
        "16mm Izukar",
        "1/800s, ISO 800",
        "Profile: CLASSIC CHROME",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Thu Apr 25 15:05, Longmont, CO",
        "FUJIFILM X-T4, 16mm Izukar",
        "1/800s, ISO 800, Profile: CLASSIC CHROME",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Tue Apr 23 11:48",
        "Longmont, CO",
        "FUJIFILM X-T4",
        "XF27mmF2.8 R WR",
        "1/3800s, ISO 640",
        "Profile: Velvia/Vivid",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Tue Apr 23 11:48, Longmont, CO",
        "FUJIFILM X-T4, XF27mmF2.8 R WR",
        "1/3800s, ISO 640, Profile: Velvia/Vivid",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Sat Mar 23 20:46",
        "Estes Park, CO",
        "FUJIFILM X-T4",
        "25mm TV",
        "1/30s, ISO 12800",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Sat Mar 23 20:46, Estes Park, CO",
        "FUJIFILM X-T4, 25mm TV, 1/30s, ISO 12800",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Fri Mar 22 18:59",
        "Estes Park, CO",
        "FUJIFILM X-T4",
        "25mm TV",
        "1/250s, ISO 6400",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Fri Mar 22 18:59, Estes Park, CO",
        "FUJIFILM X-T4, 25mm TV, 1/250s, ISO 6400",
      ]
    `);

    expect(
      chunksToLines(40, [
        "Sat May 25 23:09",
        "Boundary Waters Canoe Area, MN",
        "FUJIFILM X-T4",
        "12mm Rokinon",
        "13s, ISO 12800",
        "Profile: PROVIA/Standard",
      ])
    ).toMatchInlineSnapshot(`
      [
        "Sat May 25 23:09",
        "Boundary Waters Canoe Area, MN",
        "FUJIFILM X-T4, 12mm Rokinon",
        "13s, ISO 12800, Profile: PROVIA/Standard",
      ]
    `);
  });
});
