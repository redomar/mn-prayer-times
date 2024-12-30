import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },
  safelist: [
    "bg-[#fdbd03]",
    "bg-gray-200/50",
    "text-gray-500",
    "bg-[#fd116f]",
    "even:bg-black/5",
    "odd:bg-black/10",
  ],
  plugins: [],
} satisfies Config;
