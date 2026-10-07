import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Totes les dades depenen de la sessió del readaptador: no fem servir Cache Components.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
