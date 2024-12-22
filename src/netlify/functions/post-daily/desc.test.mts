import { describe, it, expect } from "vitest";
import { example } from "./desc.mts";

describe("example", () => {
  it("works", () => {
    expect(example()).toEqual("Hello, world!");
  });
});
