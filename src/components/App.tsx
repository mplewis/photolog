import { useState } from "react";

import type { Album, Photoset } from "../types";

import Nav from "./Nav";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";

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

  return (
    <>
      <Nav
        albums={albums}
        currentAlbum={current.album}
        setCurrentAlbum={setCurrentAlbum}
      />
      <Gallery
        photos={current.photos}
        selectedPhoto={selected}
        setSelectedPhoto={setSelected}
      />
      <Lightbox
        photos={current.photos}
        selectedPhoto={selected}
        setSelectedPhoto={setSelected}
      />
    </>
  );
};

export default App;
