import classNames from "classnames";
import type { Album } from "../types";

const Nav = ({
  albums,
  currentAlbum,
  setCurrentAlbum,
}: {
  albums: Record<string, Album>;
  currentAlbum: string;
  setCurrentAlbum: (a: string) => void;
}) => (
  <div className="fixed bg-white pt-4 pb-1 px-2 block w-full">
    <div className="flex items-end justify-between">
      <div>
        <span className="site-logo inline-block text-5xl">
          <button
            className="hover:text-sky-700 transition-all"
            onClick={() => setCurrentAlbum("_all")}>
            Photolog
          </button>
        </span>
        <span className="inline-block ml-1">by Matt Lewis</span>
      </div>
      <div>
        {Object.entries(albums).map(([, { name }], i) => (
          <button
            key={i}
            className={classNames(
              "px-4 text-sky-700 hover:text-sky-500 transition-all",
              { underline: currentAlbum === name }
            )}
            onClick={() =>
              currentAlbum === name
                ? setCurrentAlbum("_all")
                : setCurrentAlbum(name)
            }>
            {name}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default Nav;
