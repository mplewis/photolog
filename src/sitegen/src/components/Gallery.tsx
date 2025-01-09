import classNames from "classnames";
import dayjs from "dayjs";

import { SCREEN_SIZES } from "../sizes";
import type { Album } from "../common/types";

export interface GalleryPhoto {
  path: string;
  date: Date;
  sizes: {
    publicPath: string;
    width: number;
    height: number;
    thumbnail: boolean;
  }[];
}

type DateGrouping = {
  dateGroup: string; // "May 2024", "June 2022", etc.
  photos: GalleryPhoto[];
};

const gridSourceSizes = SCREEN_SIZES.map(
  ({ width, columns }) =>
    `(max-width: ${width - 1}px) ${(100 / columns).toFixed(2)}vw`
).join(", ");

const Gallery = ({
  selectedAlbum,
  photos,
  index,
  onOpen,
}: {
  selectedAlbum: Album | null;
  photos: GalleryPhoto[];
  index: number | null;
  onOpen: (index: number) => void;
}) => {
  const dateGroups: DateGrouping[] = [];
  let currentGroup: DateGrouping | null = null;
  photos.forEach((photo) => {
    const dateGroup = dayjs(photo.date).format("MMMM YYYY");
    if (!currentGroup || currentGroup.dateGroup !== dateGroup) {
      currentGroup = { dateGroup, photos: [] };
      dateGroups.push(currentGroup);
    }
    currentGroup.photos.push(photo);
  });

  let runningIndex = 0;

  const gridClassNames = classNames(
    "grid",
    "grid-cols-3",
    ...[SCREEN_SIZES.map(({ size, columns }) => `${size}:grid-cols-${columns}`)]
  );

  return (
    <div className="pt-[6rem]">
      {selectedAlbum && (
        <h1 className="text-lg px-2 text-black dark:text-white">
          Album: <span className="font-semibold">{selectedAlbum.name}</span>
          <br />
          <span className="italic text-black dark:text-slate-300">
            {selectedAlbum.desc}
          </span>
        </h1>
      )}

      {dateGroups.map(({ dateGroup, photos }) => (
        <div key={dateGroup}>
          <h1 className="text-2xl pl-2 pt-4 pb-1 font-semibold text-black dark:text-white">
            {dateGroup}
          </h1>

          <div className={gridClassNames}>
            {photos.map((photo) => {
              if (photo.sizes.length === 0)
                throw new Error(`No sizes found for photo: ${photo.path}`);

              const i = runningIndex++;

              const srcSet = photo.sizes
                .filter((s) => s.thumbnail)
                .map(({ publicPath, width }) => `${publicPath} ${width}w`)
                .join(", ");

              return (
                <div
                  className="aspect-square overflow-hidden cursor-pointer"
                  key={i}
                  onClick={() => onOpen(i)}>
                  <picture>
                    <source sizes={gridSourceSizes} srcSet={srcSet} />
                    <img
                      className={classNames(
                        "w-full h-full object-cover hover:border-8 border-transparent transition-all duration-300",
                        { "border-8": index === i }
                      )}
                    />
                  </picture>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Gallery;
