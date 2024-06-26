export type Album = {
  key: string;
  name: string;
  desc: string;
};

export const albums: Album[] = [
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
];

export const albumsByKey: Record<string, Album> = albums.reduce(
  (acc, meta) => ({ ...acc, [meta.key]: meta }),
  {} as Record<string, Album>
);
