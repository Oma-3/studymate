"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const registerServiceWorker = async () => {
        try {
          await navigator.serviceWorker.register("/sw.js");

          console.log("StudyMate service worker registered.");
        } catch (error) {
          console.error("StudyMate service worker registration failed:", error);
        }
      };

      void registerServiceWorker();
    }
  }, []);

  return null;
}
