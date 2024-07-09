import classNames from "classnames";
import dayjs from "dayjs";

import { screenSizes } from "../sizes";
import type { Photo } from "../types";
import type { Album } from "../meta";

type DateGrouping = {
  dateGroup: string; // "May 2024", "June 2022", etc.
  photos: Photo[];
};

const gridSourceSizes = screenSizes
  .map(
    ({ width, columns }) =>
      `(max-width: ${width - 1}px) ${(100 / columns).toFixed(2)}vw`
  )
  .join(",\n");

const Gallery = ({
  selectedAlbum,
  photos,
  index,
  onOpen,
}: {
  selectedAlbum: Album | null;
  photos: Photo[];
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

          <div className="grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
            {photos.map((photo) => {
              const i = runningIndex++;

              const thumbs = photo.assets.filter((u) => u.thumbnail);
              const srcSet = thumbs
                .map(({ url, width }) => `${url} ${width}w`)
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
