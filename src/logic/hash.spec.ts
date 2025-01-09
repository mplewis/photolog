import { hashB36d, hashB36s } from "./hash";

describe("hashB36s", () => {
  it("produces the expected hash", async () => {
    expect(await hashB36s("Hello, world!")).toMatchInlineSnapshot(
      `"18astxtsi9ko97a96b68bvtdy99mlidon83qok2afxqcxp158z"`
    );
    expect(await hashB36s("something else")).toMatchInlineSnapshot(
      `"631hgvmaruml5tpdqzkh70c8gy32bncolvvjvfs8arbicx76d4"`
    );
  });
});

describe("hashB36d", () => {
  it("produces the expected hash", async () => {
    expect(await hashB36d(Buffer.from("Hello, world!"))).toMatchInlineSnapshot(
      `"18astxtsi9ko97a96b68bvtdy99mlidon83qok2afxqcxp158z"`
    );
    expect(await hashB36d(Buffer.from("something else"))).toMatchInlineSnapshot(
      `"631hgvmaruml5tpdqzkh70c8gy32bncolvvjvfs8arbicx76d4"`
    );
  });
});
