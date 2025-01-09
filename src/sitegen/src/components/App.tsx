import { useEffect, useState } from "react";

import Nav from "./Nav";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";
import type { FlatAlbum, NewPhoto } from "../logic/process";

function useHash() {
  const [hash, _setHash] = useState(window.location.hash);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    function onChange() {
      if (updating) return;
      setUpdating(true);
      setHash(window.location.hash);
      setUpdating(false);
    }

    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  function setHash(newHash: string | null | undefined) {
    let nh = newHash ?? "";
    window.location.hash = nh;
    _setHash(nh);
  }

  return [hash, setHash] as const;
}

const App = ({
  albums,
  photos,
}: {
  albums: FlatAlbum[];
  photos: NewPhoto[];
}) => {
  const [selectedAlbum, _setSelectedAlbum] = useState<FlatAlbum | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [hash, setHash] = useHash();
  const [initialMount, setInitialMount] = useState(true);

  function setSelectedAlbum(i: number | null) {
    if (i === null) {
      _setSelectedAlbum(null);
      return;
    }

    const album = albums[i];
    if (!album) {
      console.warn("Album index out of range:", i);
      return;
    }
    _setSelectedAlbum(album);
  }

  function setSelectedAlbumByKey(key: string) {
    if (key === "") {
      setSelectedAlbum(null);
      return;
    }
    const album = albums.find((a) => a.key === key);
    if (!album) {
      console.warn("Album not found by key:", key);
      return;
    }
    setSelectedAlbum(albums.indexOf(album));
  }

  function updateHash() {
    if (initialMount) return;

    const parts = [selectedAlbum?.key, selectedPhoto].filter(
      (p) => p !== null && p !== undefined
    );
    setHash("/" + parts.join("/"));
  }

  useEffect(updateHash, [selectedAlbum, selectedPhoto]);

  useEffect(() => {
    const parts = hash.split("/").slice(1);
    if (parts.length === 0) return;

    if (parts.length === 1) {
      const part = parts[0]!;
      const asInt = parseInt(part);

      if (asInt) {
        setSelectedAlbum(null);
        setSelectedPhoto(asInt);
      } else {
        setSelectedAlbumByKey(part);
      }
      return;
    }

    setSelectedAlbumByKey(parts[0]!);
    setSelectedPhoto(parseInt(parts[1]!));
  }, [hash]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selectedPhoto !== null) return;
      if (e.key === "Escape") setSelectedAlbum(null);
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  });

  useEffect(() => setInitialMount(false), []);

  const photosForAlbum = selectedAlbum
    ? photos.filter((p) => p.album === selectedAlbum.key)
    : photos;

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
        onView={(i: number) => setSelectedPhoto(i)}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
};

export default App;
