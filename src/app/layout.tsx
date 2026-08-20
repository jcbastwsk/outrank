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
    default: "OUTRANK — Coaching for people who post on X",
    template: "%s · OUTRANK",
  },
  description:
    "A coach for people who post on X. It remembers what you have already said and tells you whether the next post helps.",
  metadataBase: new URL(appUrl()),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "OUTRANK",
    title: "Build a body of work, not a content calendar",
    description:
      "A coach for people who post on X. It remembers what you have already said and tells you whether the next post helps.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OUTRANK — Coaching for people who post on X",
    description:
      "A coach for people who post on X. It remembers what you have already said and tells you whether the next post helps.",
    images: ["/opengraph-image"],
  },
  other: { outrank: "1" },
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
