import {
  chunksToLines,
  guessTzFromIsoDate,
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

describe(chunksToLines, () => {
  it("splits long lines as expected", () => {
    expect(
      chunksToLines(200, [
        "FUJIFILM X-T4",
        "XF16-80mmF4 R OIS WR",
        "47mm",
        "1/480s",
        "ISO 320",
        "CLASSIC CHROME",
      ])
    ).toMatchInlineSnapshot(`
      [
        "FUJIFILM X-T4, XF16-80mmF4 R OIS WR, 47mm, 1/480s, ISO 320, CLASSIC CHROME",
      ]
    `);

    expect(
      chunksToLines(30, [
        "FUJIFILM X-T4",
        "XF16-80mmF4 R OIS WR",
        "47mm",
        "1/480s",
        "ISO 320",
        "CLASSIC CHROME",
      ])
    ).toMatchInlineSnapshot(`
      [
        "FUJIFILM X-T4, XF16-80mmF4 R OIS WR",
        "47mm, 1/480s, ISO 320, CLASSIC CHROME",
      ]
    `);

    expect(
      chunksToLines(120, [
        "When",
        "in the course of human events",
        "it becomes necessary for one people to dissolve the political bands which have connected them with another",
        "and to assume",
        "among the powers of the earth",
        "the separate and equal station to which the laws of nature and of nature’s God entitle them",
        "a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation",
        "We hold these truths to be self-evident",
        "that all men are created equal",
        "that they are endowed by their Creator with certain unalienable rights",
        "that among these are life",
        "liberty",
        "and the pursuit of happiness",
        "That",
        "to secure these rights",
        "governments are instituted among men",
        "deriving their just powers from the consent of the governed",
        "That",
        "whenever any form of government becomes destructive of these ends",
        "it is the right of the people to alter or to abolish it",
        "and to institute new government",
        "laying its foundation on such principles",
        "and organizing its powers in such form",
        "as to them shall seem most likely to effect their safety and happiness.",
      ])
    ).toMatchInlineSnapshot(`
      [
        "When, in the course of human events, it becomes necessary for one people to dissolve the political bands which have connected them with another",
        "and to assume, among the powers of the earth, the separate and equal station to which the laws of nature and of nature’s God entitle them",
        "a decent respect to the opinions of mankind requires that they should declare the causes which impel them to the separation",
        "We hold these truths to be self-evident, that all men are created equal, that they are endowed by their Creator with certain unalienable rights",
        "that among these are life, liberty, and the pursuit of happiness, That, to secure these rights, governments are instituted among men",
        "deriving their just powers from the consent of the governed, That, whenever any form of government becomes destructive of these ends",
        "it is the right of the people to alter or to abolish it, and to institute new government, laying its foundation on such principles",
        "and organizing its powers in such form, as to them shall seem most likely to effect their safety and happiness.",
      ]
    `);
  });
});

describe("guessTzFromIsoDate", () => {
  const cases = [
    ["2024-05-03T12:00:00Z", "Etc/UTC"],
    ["2024-05-03T12:00:00+00:00", "Europe/Dublin"],
    ["2024-05-03T12:00:00-00:00", "Europe/Dublin"],
    ["2022-06-01T12:00:00-04:00", "America/New_York"],
    ["2022-06-01T12:00:00-05:00", "America/Chicago"],
    ["2022-06-01T12:00:00-06:00", "America/Denver"],
    ["2022-06-01T12:00:00-07:00", "America/Los_Angeles"],
    ["2022-06-01T12:00:00+09:00", "Asia/Tokyo"],
    ["some invalid date", "Etc/UTC"],
  ] as const;

  for (const [date, tz] of cases) {
    it(`guesses the timezone for ${date} as ${tz}`, () => {
      expect(guessTzFromIsoDate(date)).toEqual(tz);
    });
  }
});
