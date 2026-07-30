import { Poppins, JetBrains_Mono } from "next/font/google";

/**
 * Self-hosted via next/font (no render-blocking Google CSS @import).
 * Weights kept tight for LCP / font payload.
 */
export const fontBody = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
  display: "swap",
});

export const fontMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});
