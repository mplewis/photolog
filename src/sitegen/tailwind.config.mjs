import { screenSizes } from "./src/sizes";

const s5 = screenSizes.find(({ size }) => size === "s5");

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {},
    screens: {
      desktop: `${s5.width}px`,
      ...Object.fromEntries(
        screenSizes.map(({ size, width }) => [size, `${width}px`])
      ),
    },
  },
  plugins: [],
};
