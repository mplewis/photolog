import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import { useState } from "react";
import classNames from "classnames";
import dayjs from "dayjs";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { Album, OriginalMetadata, Photoset } from "../types";
import Nav from "./Nav";

type PhotosetWithOriginalIndex = Photoset & { index: number };

type DateGrouping = {
  dateGroup: string; // "May 2024", "June 2022", etc.
  photosets: PhotosetWithOriginalIndex[];
};

const screenSizes = [
  { size: "s3", width: 450, columns: 3 },
  { size: "s4", width: 600, columns: 4 },
  { size: "s5", width: 750, columns: 5 },
  { size: "s6", width: 900, columns: 6 },
  { size: "s7", width: 1050, columns: 7 },
  { size: "s8", width: 1200, columns: 8 },
  { size: "s9", width: 1350, columns: 9 },
  { size: "s10", width: 1500, columns: 10 },
  { size: "s11", width: 1650, columns: 11 },
  { size: "s12", width: 1800, columns: 12 },
] as const;

const YARL_THUMBNAIL_SIZE = "w396";

const thumbSizes = [
  { size: "w180", width: 180 },
  { size: "w216", width: 216 },
  { size: "w270", width: 270 },
  { size: "w324", width: 324 },
  { size: "w396", width: 396 },
  { size: "w486", width: 486 },
  { size: "w594", width: 594 },
  { size: "w702", width: 702 },
] as const;

const fullSizes = [
  { size: "w846", width: 846 },
  { size: "w1007", width: 1007 },
  { size: "w1224", width: 1224 },
  { size: "w1476", width: 1476 },
  { size: "w1800", width: 1800 },
] as const;

const gridSourceSizes = screenSizes
  .map(
    ({ width, columns }) =>
      `(max-width: ${width - 1}px) ${(100 / columns).toFixed(2)}vw`
  )
  .join(",\n");

function srcSet(photoset: Photoset) {
  return thumbSizes
    .map(({ size }) => {
      const src = photoset.sizes[size];
      if (!src)
        throw new Error(`Missing ${size} size for ${JSON.stringify(photoset)}`);
      return `${src.url} ${src.width}w`;
    })
    .join(", ");
}

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

const Index = ({ albums }: { albums: Record<string, Album> }) => {
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

  const Gallery = () => {
    if (!current) return;

    current.photos.sort((a, b) => {
      if (!a.metadata.date) return -1;
      if (!b.metadata.date) return 1;
      return b.metadata.date.getTime() - a.metadata.date.getTime();
    });

    const dateGroups: DateGrouping[] = [];
    let currentGroup: DateGrouping | null = null;
    current.photos.forEach((photoset, index) => {
      const dateGroup = dayjs(photoset.metadata.date).format("MMMM YYYY");
      if (!currentGroup || currentGroup.dateGroup !== dateGroup) {
        currentGroup = { dateGroup, photosets: [] };
        dateGroups.push(currentGroup);
      }
      currentGroup.photosets.push({ ...photoset, index });
    });

    return (
      <div className="pt-[6rem]">
        {dateGroups.map(({ dateGroup, photosets }) => (
          <div key={dateGroup}>
            <h1 className="text-2xl pl-2 pt-4 pb-1 font-semibold">
              {dateGroup}
            </h1>
            <div className="grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
              {photosets.map((photoset) => (
                <div
                  className="aspect-square overflow-hidden cursor-pointer"
                  key={photoset.index}
                  onClick={() => setSelected(photoset.index)}>
                  <picture>
                    <source sizes={gridSourceSizes} srcSet={srcSet(photoset)} />
                    <img
                      className={classNames(
                        "w-full h-full object-cover bg-white hover:border-8 transition-all duration-300",
                        { "border-8": selected === photoset.index }
                      )}
                    />
                  </picture>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
      <Gallery />
      <Lightbox />
    </>
  );
};

export default Index;
