# Photolog

Static site generator for sharing your photos.

# TODO

- Right now, albums are defined in [`sitegen/src/meta.ts`](sitegen/src/meta.ts).
  This means that users can't specify album metadata. Change this so that album
  metadata is parsed from `photos/<album>/metadata.yaml` and included in the
  metadata report from imgpipel.
- Change the output metadata format from imgpipel so that originals point to
  processed children, rather than `original`/`processed` keys in the root
  metadata object.
- Support root-level images with no album.
- Update imgpipel from Mocha to Vitest.
