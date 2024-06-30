import { useEffect, useState } from "react";

import Nav from "./Nav";
import Gallery from "./Gallery";
import Lightbox from "./Lightbox";
import type { Photo } from "../types";
import type { Album } from "../meta";

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

const App = ({ albums, photos }: { albums: Album[]; photos: Photo[] }) => {
  const [selectedAlbum, _setSelectedAlbum] = useState<Album | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [hash, setHash] = useHash();

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
    const parts = [selectedAlbum?.key, selectedPhoto].filter(
      (p) => p !== null && p !== undefined
    );
    setHash("/" + parts.join("/"));
  }

  useEffect(updateHash, [selectedAlbum, selectedPhoto]);

  useEffect(() => {
    const parts = hash.split("/").slice(1);
    console.log("hash", hash, "parts", ...parts);
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
        onView={(i: number) => setSelectedPhoto(i)}
        onClose={() => setSelectedPhoto(null)}
      />
    </>
  );
};

export default App;
