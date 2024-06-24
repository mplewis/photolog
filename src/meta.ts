export type AlbumKey = (typeof albumMeta)[number]["key"];
export type AlbumMeta = (typeof albumMeta)[number];

export const albumMeta = [
  {
    key: "bwca",
    name: "BWCA",
    desc: "The pristine Boundary Waters Canoe Area of northern Minnesota",
  },
  {
    key: "japan",
    name: "Japan",
    desc: "My trip to Tokyo, Kyoto, Hiroshima, and Osaka",
  },
  {
    key: "europe",
    name: "Europe",
    desc: "France and Iceland",
  },
  {
    key: "colorado",
    name: "Colorado",
    desc: "Views from my home state",
  },
] as const;

export const albumMetaByKey: Record<AlbumKey, AlbumMeta> = albumMeta.reduce(
  (acc, meta) => ({ ...acc, [meta.key]: meta }),
  {} as Record<AlbumKey, AlbumMeta>
);
