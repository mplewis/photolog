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
  });
});
