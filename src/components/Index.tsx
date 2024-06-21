import { useState } from "react";
import classNames from "classnames";
import Modal from "react-modal";

export type Album = {
  /** Human-readable name of the album*/
  name: string;
  desc: string;
  photosets: Record<string, Photoset>;
};
// TODO: Add metadata
export type Photoset = Record<string, string>; // size -> url

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

const thumbSizes = [
  { size: "w180", width: 180 },
  { size: "w216", width: 216 },
  { size: "w270", width: 270 },
  { size: "w324", width: 324 },
  { size: "w396", width: 396 },
  { size: "w486", width: 486 },
  { size: "w594", width: 594 },
  { size: "w702", width: 702 },
  { size: "w846", width: 846 },
] as const;

const sourceSizes = screenSizes
  .map(
    ({ width, columns }) =>
      `(max-width: ${width - 1}px) ${(100 / columns).toFixed(2)}vw`
  )
  .join(",\n");

Modal.setAppElement("#app");

const Index = ({ albums }: { albums: Record<string, Album> }) => {
  const albumToPhotoset: Record<string, Photoset[]> = { _all: [] };
  for (const { name, photosets: photos } of Object.values(albums)) {
    albumToPhotoset[name] = [];
    for (const [, photoset] of Object.entries(photos)) {
      albumToPhotoset[name]!.push(photoset);
      albumToPhotoset._all!.push(photoset);
    }
  }

  const [album, setAlbum] = useState<string>("_all");

  return (
    <>
      <Modal isOpen={false}>
        <h1>Hi! I am a modal</h1>
      </Modal>

      <div className="fixed bg-white pt-4 pb-1 px-2 block w-full">
        <div className="flex items-end justify-between">
          <div>
            <span className="site-logo inline-block text-5xl">Photolog</span>
            <span className="inline-block ml-1">by Matt Lewis</span>
          </div>
          <div>
            {Object.entries(albums).map(([, { name }]) => (
              <button
                className={classNames(
                  "px-4 text-sky-700 hover:text-sky-500 transition-all",
                  {
                    "font-bold": album === name,
                  }
                )}
                key={name}
                onClick={() =>
                  album === name ? setAlbum("_all") : setAlbum(name)
                }>
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-24 grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
        {Object.entries(albumToPhotoset[album]!).map(([key, photoset]) => (
          <div className="aspect-square" key={key}>
            <picture>
              <source
                type="image/jpeg"
                sizes={sourceSizes}
                srcSet={thumbSizes
                  .map(({ size, width }) => `${photoset[size]} ${width}w`)
                  .join(", ")}
              />
              <img className="w-full h-full object-cover" />
            </picture>
          </div>
        ))}
      </div>
    </>
  );
};

export default Index;
