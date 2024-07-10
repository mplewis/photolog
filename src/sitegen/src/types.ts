export type Photo = {
  date: Date;
  title: string | null;
  description: string;
  albums: string[];
  assets: Asset[];
};

export type Asset = {
  url: string;
  width: number;
  height: number;
  thumbnail: boolean;
};
