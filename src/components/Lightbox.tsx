import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import { YARL_THUMBNAIL_SUFFIX } from "../sizes";
import type { Photo } from "../types";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

function filenameEndsWithSuffix(filename: string, suffix: string) {
  const filenameNoExt = filename.split(".").slice(0, -1).join(".");
  return filenameNoExt.endsWith(suffix);
}

const Lightbox = ({
  photos,
  index,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onClose: () => void;
}) => {
  const slides: SlideImage[] = photos.map((photo) => {
    const fullSizes = photo.assets.filter((a) => !a.thumbnail);

    const srcSet = fullSizes.map(({ url, width, height }) => ({
      src: url,
      width,
      height,
    }));
    const yarlThumbnail = photo.assets.find(
      (a) => a.thumbnail && filenameEndsWithSuffix(a.url, YARL_THUMBNAIL_SUFFIX)
    );
    if (!yarlThumbnail)
      throw new Error(
        `No YARL thumbnail found with suffix ${YARL_THUMBNAIL_SUFFIX}`
      );

    const { title, description } = photo;
    const { url: src, width, height } = yarlThumbnail;
    return { title, description, srcSet, src, width, height };
  });

  return (
    <YARL
      plugins={[Captions, Thumbnails]}
      open={index != null}
      close={onClose}
      index={index ?? 0}
      slides={slides}
      carousel={{
        padding: 0,
      }}
      captions={{
        showToggle: true,
        descriptionMaxLines: 8,
        descriptionTextAlign: "center",
      }}
      thumbnails={{
        border: 0,
        showToggle: true,
        gap: 8,
        padding: 0,
        imageFit: "cover",
      }}
    />
  );
};

export default Lightbox;
