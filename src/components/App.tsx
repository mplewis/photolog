import { useState } from "react";

import type { Album, Photoset } from "../types";

import Nav from "./Nav";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";
import type { AlbumKey } from "../meta";

const App = ({ albums }: { albums: Record<AlbumKey, Album> }) => {
  const albumToPhotoset: Record<string, Photoset[]> = { _all: [] };
  for (const [key, { photosets }] of Object.entries(albums)) {
    albumToPhotoset[key] = [];
    for (const [, photoset] of Object.entries(photosets)) {
      albumToPhotoset[key]!.push(photoset);
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

  const [current, setCurrent] = useState<{
    album: AlbumKey | null;
    photos: Photoset[];
  }>({ album: null, photos: albumToPhotoset._all! });
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  function setSelectedAlbum(key: AlbumKey | null) {
    const k = key ?? "_all";
    const photos = albumToPhotoset[k];
    if (!photos) throw new Error(`Album not found: ${k}`);
    setCurrent({ album: key, photos });
  }

  return (
    <>
      <Nav
        albums={albums}
        selectedAlbum={current.album}
        setSelectedAlbum={setSelectedAlbum}
      />
      <Gallery
        selectedAlbum={current.album}
        photos={current.photos}
        selectedPhoto={selectedPhoto}
        setSelectedPhoto={setSelectedPhoto}
      />
      <Lightbox
        photos={current.photos}
        selectedPhoto={selectedPhoto}
        setSelectedPhoto={setSelectedPhoto}
      />
    </>
  );
};

export default App;
