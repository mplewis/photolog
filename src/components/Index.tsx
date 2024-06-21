import { useState } from "react";
import classNames from "classnames";
import ReactModal from "react-modal";

export type Album = {
  /** Human-readable name of the album */
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

const gridSourceSizes = screenSizes
  .map(
    ({ width, columns }) =>
      `(max-width: ${width - 1}px) ${(100 / columns).toFixed(2)}vw`
  )
  .join(",\n");

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

ReactModal.setAppElement("#app");

const modalStyle = {
  content: {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 0,
    backgroundColor: "black",
    border: "none",
    borderRadius: 0,
  },
};

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
  const [selectedPhoto, setSelectedPhoto] = useState<Photoset | null>(null);

  const Modal = () => (
    <ReactModal
      isOpen={Boolean(selectedPhoto)}
      onRequestClose={() => setSelectedPhoto(null)}
      style={modalStyle}>
      {selectedPhoto && (
        <picture>
          <source
            type="image/jpeg"
            srcSet={fullSizes
              .map(({ size, width }) => `${selectedPhoto![size]} ${width}w`)
              .join(", ")}
          />
          <img
            className="w-full h-full object-scale-down cursor-pointer"
            onClick={() => setSelectedPhoto(null)}
          />
        </picture>
      )}
    </ReactModal>
  );

  const Nav = () => (
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
  );

  const Gallery = () => (
    <div className="pt-24 grid grid-cols-3 s4:grid-cols-4 s5:grid-cols-5 s6:grid-cols-6 s7:grid-cols-7 s8:grid-cols-8 s9:grid-cols-9 s10:grid-cols-10 s11:grid-cols-11 s12:grid-cols-12">
      {Object.entries(albumToPhotoset[album]!).map(([key, photoset]) => (
        <div
          className="aspect-square overflow-hidden cursor-pointer"
          key={key}
          onClick={() => setSelectedPhoto(photoset)}>
          <picture>
            <source
              type="image/jpeg"
              sizes={gridSourceSizes}
              srcSet={thumbSizes
                .map(({ size, width }) => `${photoset[size]} ${width}w`)
                .join(", ")}
            />
            {/* FIXME: hovering over an image raises it over the nav bar */}
            <img className="w-full h-full object-cover hover:scale-110 transition-all duration-300" />
          </picture>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Modal />
      <Nav />
      <Gallery />
    </>
  );
};

export default Index;
