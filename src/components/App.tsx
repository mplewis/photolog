import { useEffect, useState } from "react";

import Nav from "./Nav";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";
import type { Photo } from "../types";
import type { Album } from "../meta";

const App = ({ albums, photos }: { albums: Album[]; photos: Photo[] }) => {
  const [selectedAlbum, _setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  const setSelectedAlbum = (i: number | null) => {
    if (i === null) {
      _setSelectedAlbum(null);
      return;
    }
    const album = albums[i];
    if (!album) throw new Error(`Album index out of range: ${i}`);
    _setSelectedAlbum(album);
  };

  const photosForAlbum = selectedAlbum
    ? photos.filter((p) => p.albums.includes(selectedAlbum.key))
    : photos;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedPhoto !== null) return;
      if (e.key === "Escape") setSelectedAlbum(null);
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  return (
    <>
      <Nav
        albums={albums}
        selectedAlbum={selectedAlbum}
        setSelectedAlbum={setSelectedAlbum}
      />
      <Gallery
        selectedAlbum={selectedAlbum}
        photos={photosForAlbum}
        index={selectedPhoto}
        onOpen={(i: number) => setSelectedPhoto(i)}
      />
      <Lightbox
        photos={photosForAlbum}
        index={selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
};

export default App;
