export type AlbumKey = keyof typeof albumMeta;

export const albumMeta = {
  bwca: {
    name: "Boundary Waters",
    desc: "The pristine Boundary Waters Canoe Area of northern Minnesota",
  },
  japan: {
    name: "Japan",
    desc: "Tokyo, Kyoto, Hiroshima, and Osaka",
  },
  europe: { name: "Europe", desc: "France and Iceland" },
  colorado: {
    name: "Colorado",
    desc: "Views from my home state",
  },
} as const;
