import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import { useState } from "react";
import dayjs from "dayjs";

import type { Album, OriginalMetadata, Photoset } from "../types";
import { YARL_THUMBNAIL_SIZE, fullSizes } from "../sizes";

import Nav from "./Nav";
import Gallery from "./Gallery";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

function trimSp(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

function trimCommonPrefixWords(base: string, toTrim: string): string {
  const baseWords = base.split(" ");
  const toTrimWords = toTrim.split(" ");
  for (let i = 0; i < baseWords.length && i < toTrimWords.length; i++) {
    if (baseWords[i] !== toTrimWords[i]) return toTrimWords.slice(i).join(" ");
  }
  return toTrimWords.slice(baseWords.length).join(" ");
}

function prettyMeta(m: OriginalMetadata): {
  title: string;
  description: string;
} {
  const t: string[] = [];
  if (m.title) t.push(m.title);
  if (m.location) t.push(m.location);
  const title = t.join(", ");

  const camera = trimSp(`${m.cameraMake || ""} ${m.cameraModel || ""}`);
  let lens = trimSp(`${m.lensMake || ""} ${m.lensModel || ""}`);
  lens = trimCommonPrefixWords(camera, lens);

  const s: string[] = [];
  if (m.exposureTime) s.push(`${m.exposureTime}s`);
  if (m.fNumber) s.push(`f/${m.fNumber}`);
  if (m.iso) s.push(`ISO ${m.iso}`);
  const settings = s.join(", ");

  const d: string[] = [];
  if (camera) d.push(camera);
  if (lens) d.push(lens);
  if (settings) d.push(settings);
  const details = d.join(", ");

  if (!m.date) throw new Error(`Missing date for ${JSON.stringify(m)}`);

  const description = [
    // photoset.sizes[YARL_THUMBNAIL_SIZE].url,
    m.description && m.description + "\n",
    dayjs(m.date).format("dddd, MMMM D, YYYY"),
    details,
  ]
    .filter(Boolean)
    .join("\n")
    .trim();

  return { title, description };
}

const App = ({ albums }: { albums: Record<string, Album> }) => {
  const albumToPhotoset: Record<string, Photoset[]> = { _all: [] };
  for (const { name, photosets } of Object.values(albums)) {
    albumToPhotoset[name] = [];
    for (const [, photoset] of Object.entries(photosets)) {
      albumToPhotoset[name]!.push(photoset);
      albumToPhotoset._all!.push(photoset);
    }
  }

  // Sort all albums by date descending
  for (const album of Object.values(albumToPhotoset)) {
    album.sort((a, b) => {
      if (!a.metadata.date) return -1;
      if (!b.metadata.date) return 1;
      return b.metadata.date.getTime() - a.metadata.date.getTime();
    });
  }

  const [current, setCurrent] = useState<{ album: string; photos: Photoset[] }>(
    { album: "_all", photos: albumToPhotoset._all! }
  );
  const [selected, setSelected] = useState<number | null>(null);

  function setCurrentAlbum(name: string) {
    const photos = albumToPhotoset[name];
    if (!photos) throw new Error(`Album not found: ${name}`);
    setCurrent({ album: name, photos });
  }

  const Lightbox = () => {
    if (!current) return;

    const slides: SlideImage[] = current.photos.map((photoset) => {
      if (!photoset.sizes[YARL_THUMBNAIL_SIZE])
        throw new Error(
          `Missing ${YARL_THUMBNAIL_SIZE} size for ${JSON.stringify(photoset)}`
        );

      const { title, description } = prettyMeta(photoset.metadata);

      const srcSet = fullSizes.map(({ size }) => {
        const src = photoset.sizes[size];
        if (!src)
          throw new Error(
            `Missing ${size} size for ${JSON.stringify(photoset)}`
          );
        return { src: src.url, width: src.width, height: src.height };
      });

      return {
        title,
        description,
        srcSet,
        src: photoset.sizes[YARL_THUMBNAIL_SIZE].url,
        width: photoset.sizes[YARL_THUMBNAIL_SIZE].width,
        height: photoset.sizes[YARL_THUMBNAIL_SIZE].height,
      };
    });

    return (
      <YARL
        plugins={[Captions, Thumbnails]}
        open={selected !== null}
        close={() => setSelected(null)}
        index={selected ?? 0}
        slides={slides}
        captions={{
          showToggle: true,
          descriptionMaxLines: 8,
          descriptionTextAlign: "center",
        }}
        thumbnails={{
          hidden: document.documentElement.clientHeight < 800,
          border: 0,
          showToggle: true,
          gap: 8,
          padding: 0,
          imageFit: "cover",
        }}
      />
    );
  };

  return (
    <>
      <Nav
        albums={albums}
        currentAlbum={current.album}
        setCurrentAlbum={setCurrentAlbum}
      />
      <Gallery
        photos={current.photos}
        setSelectedPhoto={setSelected}
        selectedPhoto={selected}
      />
      <Lightbox />
    </>
  );
};

export default App;
