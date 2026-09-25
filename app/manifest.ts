import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StudyMate",
    short_name: "StudyMate",

    description:
      "Turn your study notes into intelligent quizzes, review your mistakes, and track your learning progress.",

    start_url: "/",

    display: "standalone",

    background_color: "#FDF8F3",

    theme_color: "#7C3AED",

    orientation: "portrait-primary",

    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
