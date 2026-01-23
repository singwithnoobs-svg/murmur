import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./root/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./root/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // GitHub-inspired dark palette
        brand: {
          bg: "#0d1117",
          card: "#161b22",
          border: "#30363d",
          primary: "#238636", // Green button like GitHub
          accent: "#7c3aed",  // Purple for Murmur
        }
      },
    },
  },
  plugins: [],
};
export default config;