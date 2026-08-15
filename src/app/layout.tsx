import type { Metadata } from "next";
import { Geist, Instrument_Serif, Pixelify_Sans, VT323 } from "next/font/google";
import { appUrl } from "../lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const instrument = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
});

const vt = VT323({
  variable: "--font-vt",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: {
    default: "Outrank — Algorithm radar for X",
    template: "%s · Outrank",
  },
  description:
    "X just published the For You ranking weights. Outrank watches every commit and coaches you, live, on how to get shown.",
  metadataBase: new URL(appUrl()),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${instrument.variable} ${pixel.variable} ${vt.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
