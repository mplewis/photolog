export const thumbnailMaxWidthPx = 800; // anything wider than this is a "full" image

export const screenSizes = [
  { size: "s3", width: 450, columns: 3 },
  { size: "s4", width: 600, columns: 4 },
  { size: "s5", width: 750, columns: 5 },
  { size: "s6", width: 900, columns: 6 },
  { size: "s7", width: 1050, columns: 7 },
  { size: "s8", width: 1200, columns: 8 },
  { size: "s9", width: 1350, columns: 9 },
  { size: "s10", width: 1500, columns: 10 },
  { size: "s11", width: 1650, columns: 11 },
  { size: "s12", width: 1800, columns: 12 },
] as const;
