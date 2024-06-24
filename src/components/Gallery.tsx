import classNames from "classnames";
import dayjs from "dayjs";

import type { Photoset } from "../types";
import { screenSizes, thumbSizes } from "../sizes";

type PhotosetWithOriginalIndex = Photoset & { index: number };

type DateGrouping = {
  dateGroup: string; // "May 2024", "June 2022", etc.
  photosets: PhotosetWithOriginalIndex[];
};

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

const Gallery = ({
  photos,
  selectedPhoto,
  setSelectedPhoto,
}: {
  photos: Photoset[];
  selectedPhoto: number | null;
  setSelectedPhoto: (index: number) => void;
}) => {
  photos.sort((a, b) => {
    if (!a.metadata.date) return -1;
    if (!b.metadata.date) return 1;
    return b.metadata.date.getTime() - a.metadata.date.getTime();
  });

  const dateGroups: DateGrouping[] = [];
  let currentGroup: DateGrouping | null = null;
  photos.forEach((photoset, index) => {
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
          <h1 className="text-2xl pl-2 pt-4 pb-1 font-semibold">{dateGroup}</h1>
          <div className="grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
            {photosets.map((photoset) => (
              <div
                className="aspect-square overflow-hidden cursor-pointer"
                key={photoset.index}
                onClick={() => setSelectedPhoto(photoset.index)}>
                <picture>
                  <source sizes={gridSourceSizes} srcSet={srcSet(photoset)} />
                  <img
                    className={classNames(
                      "w-full h-full object-cover bg-white hover:border-8 transition-all duration-300",
                      { "border-8": selectedPhoto === photoset.index }
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

export default Gallery;
