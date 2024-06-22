import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import { useState } from "react";
import classNames from "classnames";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import type { OriginalMetadata } from "../types";

export type Album = {
  /** Human-readable name of the album */
  name: string;
  desc: string;
  photosets: Record<string, Photoset>;
};

export type Photoset = {
  metadata: OriginalMetadata;
  sizes: Record<string, { url: string; width: number; height: number }>;
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

const Index = ({ albums }: { albums: Record<string, Album> }) => {
  const albumToPhotoset: Record<string, Photoset[]> = { _all: [] };
  for (const { name, photosets: photos } of Object.values(albums)) {
    albumToPhotoset[name] = [];
    for (const [, photoset] of Object.entries(photos)) {
      albumToPhotoset[name]!.push(photoset);
      albumToPhotoset._all!.push(photoset);
    }
  }

  const [current, setCurrent] = useState<{ album: string; photos: Photoset[] }>(
    { album: "_all", photos: albumToPhotoset._all! }
  );
  const [selected, setSelected] = useState<number | null>(null);

  function setAlbum(name: string) {
    const photos = albumToPhotoset[name];
    if (!photos) throw new Error(`Album not found: ${name}`);
    setCurrent({ album: name, photos });
  }

  const Nav = () => (
    <div className="fixed bg-white pt-4 pb-1 px-2 block w-full">
      <div className="flex items-end justify-between">
        <div>
          <span className="site-logo inline-block text-5xl">
            <button
              className="hover:text-sky-700 transition-all"
              onClick={() => setAlbum("_all")}>
              Photolog
            </button>
          </span>
          <span className="inline-block ml-1">by Matt Lewis</span>
        </div>
        <div>
          {Object.entries(albums).map(([, { name }], i) => (
            <button
              key={i}
              className={classNames(
                "px-4 text-sky-700 hover:text-sky-500 transition-all",
                { underline: current.album === name }
              )}
              onClick={() =>
                current.album === name ? setAlbum("_all") : setAlbum(name)
              }>
              {name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const Gallery = () => {
    if (!current) return;

    function srcSet(photoset: Photoset) {
      return thumbSizes
        .map(({ size }) => {
          const src = photoset.sizes[size];
          if (!src)
            throw new Error(
              `Missing ${size} size for ${JSON.stringify(photoset)}`
            );
          return `${src.url} ${src.width}w`;
        })
        .join(", ");
    }

    return (
      <div className="pt-24 grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
        {current.photos.map((photoset, i) => (
          <div
            className="aspect-square overflow-hidden cursor-pointer"
            key={i}
            onClick={() => setSelected(i)}>
            <picture>
              <source
                type="image/jpeg"
                sizes={gridSourceSizes}
                srcSet={srcSet(photoset)}
              />
              <img
                className={classNames(
                  "w-full h-full object-cover bg-white hover:border-8 transition-all duration-300",
                  { "border-8": selected === i }
                )}
              />
            </picture>
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
      return {
        src: photoset.sizes[YARL_THUMBNAIL_SIZE].url,
        width: photoset.sizes[YARL_THUMBNAIL_SIZE].width,
        height: photoset.sizes[YARL_THUMBNAIL_SIZE].height,
        srcSet: fullSizes.map(({ size }) => {
          const src = photoset.sizes[size];
          if (!src)
            throw new Error(
              `Missing ${size} size for ${JSON.stringify(photoset)}`
            );
          return { src: src.url, width: src.width, height: src.height };
        }),
      };
    });

    return (
      <YARL
        plugins={[Thumbnails]}
        open={selected !== null}
        close={() => setSelected(null)}
        index={selected ?? 0}
        slides={slides}
        thumbnails={{
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
      <Nav />
      <Gallery />
      <Lightbox />
    </>
  );
};

export default Index;
