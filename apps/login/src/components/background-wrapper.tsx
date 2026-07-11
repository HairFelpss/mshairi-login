"use client";

import { useThemeConfig } from "@/lib/theme-hooks";
import { ReactNode } from "react";

/**
 * BackgroundWrapper component handles applying background images from theme configuration.
 * This needs to be a client component to access environment variables via the theme hook.
 */
export function BackgroundWrapper({ children, className = "" }: { children: ReactNode; className?: string }) {
  const themeConfig = useThemeConfig();

  const backgroundStyle = themeConfig.backgroundImage
    ? {
        backgroundImage: `url(${themeConfig.backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : {};

  return (
    <div className={className} style={backgroundStyle}>
      {/* Mshairi: brand aurora behind the frosted card (glass appearance only).
          Children stay on top because the layout's content container is positioned. */}
      {themeConfig.appearance === "glass" && !themeConfig.backgroundImage && (
        <div className="mshairi-aurora" aria-hidden>
          <div className="mshairi-aurora__wash" />
          <div className="mshairi-aurora__blob mshairi-aurora__blob--1" />
          <div className="mshairi-aurora__blob mshairi-aurora__blob--2" />
          <div className="mshairi-aurora__blob mshairi-aurora__blob--3" />
          <div className="mshairi-aurora__ring" />
          <div className="mshairi-aurora__ring mshairi-aurora__ring--outer" />
        </div>
      )}
      {children}
    </div>
  );
}
