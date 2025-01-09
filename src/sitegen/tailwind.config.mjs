import { SCREEN_SIZES } from "./src/sizes";

const s5 = SCREEN_SIZES.find(({ size }) => size === "s5");

const screens = {
  desktop: `${s5.width}px`,
  ...Object.fromEntries(
    SCREEN_SIZES.map(({ size, width }) => [size, `${width}px`])
  ),
};

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: { extend: {}, screens },
  plugins: [],
};
