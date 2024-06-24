import classNames from "classnames";
import type { Album } from "../types";
import type { AlbumKey } from "../meta";
import { useState } from "react";

const Nav = ({
  albums,
  selectedAlbum,
  setSelectedAlbum,
}: {
  albums: Record<AlbumKey, Album>;
  selectedAlbum: AlbumKey | null;
  setSelectedAlbum: (a: AlbumKey | null) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="fixed bg-white pt-4 pb-1 px-2 block w-full">
      <div className="flex items-end justify-between">
        <div>
          <span className="site-logo inline-block text-5xl">
            <button
              className="hover:text-sky-700 transition-all"
              onClick={() => setSelectedAlbum(null)}>
              Photolog
            </button>
          </span>
          <span className="inline-block ml-1">
            by{" "}
            <a href="https://mplewis.com" className="hover:text-sky-700">
              Matt Lewis
            </a>
          </span>
        </div>

        {/* Desktop menu */}
        <div className="hidden s5:block">
          {Object.entries(albums).map(([key, { name }], i) => (
            <button
              key={i}
              className={classNames(
                "px-4 text-sky-700 hover:text-sky-500 transition-all",
                {
                  underline: selectedAlbum === key,
                  "font-bold": selectedAlbum === key,
                }
              )}
              onClick={() =>
                selectedAlbum === key
                  ? setSelectedAlbum(null)
                  : setSelectedAlbum(key as AlbumKey)
              }>
              {name}
            </button>
          ))}
        </div>

        {/* Mobile menu */}
        <div className="block s5:hidden">
          <button
            className={classNames(
              "text-2xl p-4 aspect-square text-sky-700 hover:text-sky-500 transition-all"
            )}
            onClick={() => setShowMenu(!showMenu)}>
            {showMenu ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div className={classNames("pt-4", { hidden: !showMenu })}>
        {Object.entries(albums).map(([key, { name }], i) => (
          <div>
            <button
              key={i}
              className={classNames(
                "pl-1 py-3 text-lg text-sky-700 hover:text-sky-500 transition-all",
                {
                  underline: selectedAlbum === key,
                  "font-bold": selectedAlbum === key,
                }
              )}
              onClick={() => {
                selectedAlbum === key
                  ? setSelectedAlbum(null)
                  : setSelectedAlbum(key as AlbumKey);
                setShowMenu(false);
              }}>
              {name}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Nav;
