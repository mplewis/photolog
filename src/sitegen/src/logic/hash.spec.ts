import { hashB36 } from "./hash";

describe("hashB36", () => {
  it("produces the expected hash", async () => {
    expect(await hashB36("Hello, world!")).toMatchInlineSnapshot(
      `"18astxtsi9ko97a96b68bvtdy99mlidon83qok2afxqcxp158z"`
    );
    expect(await hashB36("something else")).toMatchInlineSnapshot(
      `"631hgvmaruml5tpdqzkh70c8gy32bncolvvjvfs8arbicx76d4"`
    );
  });
});
