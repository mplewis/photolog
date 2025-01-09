import classNames from "classnames";
import { useState } from "react";
import type { Album } from "../logic/process";

const Nav = ({
  albums,
  selectedAlbum,
  setSelectedAlbum,
}: {
  albums: Album[];
  selectedAlbum: Album | null;
  setSelectedAlbum: (index: number | null) => void;
}) => {
  const [showMenu, setShowMenu] = useState(false);

  function select(index: number | null) {
    setSelectedAlbum(index);
    setShowMenu(false);
  }

  function isSelected(key: string): boolean {
    if (!selectedAlbum) return false;
    return selectedAlbum.key === key;
  }

  return (
    <div className="fixed bg-slate-200 dark:bg-slate-700 text-black dark:text-white pt-4 pb-1 px-2 block w-full">
      <div className="flex items-end justify-between">
        <div>
          <span className="site-logo inline-block text-5xl">
            <button
              className="hover:text-sky-700 dark:hover:text-sky-400 transition-all"
              onClick={() => select(null)}>
              Photolog
            </button>
          </span>
          <span className="inline-block ml-1 text-slate-900 dark:text-slate-300">
            by{" "}
            <a
              href="https://mplewis.com"
              className="hover:text-sky-700 dark:hover:text-sky-400">
              Matt Lewis
            </a>
          </span>
        </div>

        {/* Desktop menu */}
        <div className="hidden desktop:block">
          {albums.map(({ key, name }, i) => (
            <button
              key={i}
              className={classNames(
                "px-4 pt-4 text-sky-700 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-200 transition-all",
                {
                  underline: isSelected(key),
                  "font-bold": isSelected(key),
                }
              )}
              onClick={() => select(isSelected(key) ? null : i)}>
              {name}
            </button>
          ))}
        </div>

        {/* Mobile menu */}
        <div className="block desktop:hidden">
          <button
            className={classNames(
              "text-2xl p-4 aspect-square text-sky-700 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-200 transition-all"
            )}
            onClick={() => setShowMenu(!showMenu)}>
            {showMenu ? "▲" : "▼"}
          </button>
        </div>
      </div>

      <div className={classNames("pt-4", { hidden: !showMenu })}>
        {albums.map(({ key, name }, i) => (
          <button
            key={i}
            className={classNames(
              "block w-full pl-1 py-3 text-lg text-sky-700 hover:text-sky-500 dark:text-sky-400 dark:hover:text-sky-200 transition-all text-left",
              {
                underline: isSelected(key),
                "font-bold": isSelected(key),
              }
            )}
            onClick={() => select(isSelected(key) ? null : i)}>
            {name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Nav;
