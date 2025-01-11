import { join } from "path";
import { loadConfig } from "./config";

describe("loadConfig", () => {
  it("loads the default config successfully", async () => {
    const config = await loadConfig(
      join(__dirname, "fixtures", "default-config.yaml")
    );
    expect(config).toMatchInlineSnapshot(`
      {
        "fileHashLen": 8,
        "imageDir": "/path/to/your/photos",
        "publicPathPrefix": "photos",
        "qualityButteraugli": 1,
        "siteDescription": "A place for me to share my photos",
        "siteTitle": "My Photolog",
        "siteURL": "https://example.com",
      }
    `);
  });
});
