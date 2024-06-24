import classNames from "classnames";
import type { Album } from "../types";
import type { AlbumKey } from "../meta";

const Nav = ({
  albums,
  selectedAlbum,
  setSelectedAlbum,
}: {
  albums: Record<AlbumKey, Album>;
  selectedAlbum: AlbumKey | null;
  setSelectedAlbum: (a: AlbumKey | null) => void;
}) => (
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
        <span className="inline-block ml-1">by Matt Lewis</span>
      </div>
      <div>
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
    </div>
  </div>
);

export default Nav;
