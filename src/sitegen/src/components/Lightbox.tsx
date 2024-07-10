import YARL, { type SlideImage } from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";

import type { Photo } from "../types";
import { thumbnailMaxWidthPx } from "../sizes";

import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import { useEffect } from "react";

const styles = {
  captionsTitleContainer: {
    background: "none",
    padding: "0",
  },
  captionsTitle: {
    fontWeight: "300",
    background: "rgba(0, 0, 0, 0.65)",
    display: "inline-block",
    marginTop: "8px",
    padding: "4px 10px",
    paddingLeft: "16px",
    fontSize: "1.2em",
    borderTopRightRadius: "8px",
    borderBottomRightRadius: "8px",
  },
  captionsDescriptionContainer: {
    background: "none",
    left: "unset",
    padding: "8px",
    paddingRight: "0",
    textAlign: "right",
  },
  captionsDescription: {
    background: "rgba(0, 0, 0, 0.65)",
    display: "inline",
    padding: "5px 8px",
    textAlign: "right",
    lineHeight: "32px",
    borderTopLeftRadius: "6px",
    borderBottomLeftRadius: "6px",
    boxDecorationBreak: "clone",
    "-webkit-box-decoration-break": "clone",
  },
} as const;

const Lightbox = ({
  photos,
  index,
  onView,
  onClose,
}: {
  photos: Photo[];
  index: number | null;
  onView: (index: number) => void;
  onClose: () => void;
}) => {
  const slides: SlideImage[] = photos.map((photo) => {
    const fullSizes = photo.assets.filter((a) => !a.thumbnail);
    if (fullSizes.length === 0) throw new Error("No full-size images found"); // assertion for compile-time check
    const srcSet = fullSizes.map(({ url, width, height }) => ({
      src: url,
      width,
      height,
    }));

    const defaultThumbnail = photo.assets.reduce(
      (acc, a) => (acc && acc.width > a.width ? acc : a),
      photo.assets[0]
    );
    if (!defaultThumbnail) throw new Error("No default thumbnail found"); // assertion for compile-time check

    const { title, description } = photo;
    const { url: src, width, height } = defaultThumbnail;
    return { title, description, srcSet, src, width, height };
  });

  // HACK: Force re-layout of captions when they appear. This is an issue with Firefox,
  // where inline nowrap captions render with unwanted whitespace on the right side
  // of the first line of text, or the last line of text comes with an unnecessary wrap.
  useEffect(() => {
    const SENTINEL_CLASS = "__hack-layout-fixed";
    const int = setInterval(() => {
      const descs = Array.prototype.slice
        .call(document.querySelectorAll(".yarl__slide_description"))
        .filter((e) => !e.classList.contains(SENTINEL_CLASS));

      window.requestAnimationFrame(() => {
        descs.forEach((e) => e.style.setProperty("text-align", "left"));
        window.requestAnimationFrame(() => {
          descs.forEach((e) => e.style.setProperty("text-align", "right"));
        });
      });

      descs.forEach((e) => e.classList.add(SENTINEL_CLASS));
    }, 200);

    return () => clearInterval(int);
  }, []);

  return (
    <YARL
      styles={styles}
      plugins={[Captions, Thumbnails]}
      open={index != null}
      close={onClose}
      index={index ?? 0}
      slides={slides}
      on={{ view: ({ index }) => onView(index) }}
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
