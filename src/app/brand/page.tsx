import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteFooter, SiteHeader } from "../../components/SiteHeader";

export const metadata: Metadata = {
  title: "Mark",
  description: "OUTRANK mark — midnight chrome.",
};

const NIGHT = [
  {
    src: "/brand/night-dish.jpg",
    id: "now",
    name: "Dish · live",
    note: "What is on the site. The one we kept.",
  },
  {
    src: "/brand/night-delta.jpg",
    id: "08",
    name: "Delta tile",
    note: "Same bezel. Residual instead of the dish.",
  },
  {
    src: "/brand/night-spike.jpg",
    id: "09",
    name: "Spike",
    note: "Dish becomes a gold residual.",
  },
  {
    src: "/brand/night-gif.jpg",
    id: "10",
    name: "GIF caret",
    note: "1996 under construction.",
  },
  {
    src: "/brand/night-pin.jpg",
    id: "11",
    name: "Pin",
    note: "On the Trinitron.",
  },
];

export default function BrandPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-16">
        <p className="mono text-[13px] text-[var(--gold)]">X kit · dithered</p>
        <h1 className="serif mt-3 text-5xl">Avatar and banner.</h1>
        <p className="mt-4 max-w-xl leading-7 text-[var(--muted)]">
          The dish, Bayer-dithered to the site palette. 400×400 and 1500×500.
          Upload the dithered files.
        </p>

        <section className="relative mt-10 overflow-hidden card">
          <Image
            src="/brand/x-banner-dither.jpg"
            alt="X banner"
            width={1500}
            height={500}
            className="h-auto w-full"
            priority
          />
          <div className="absolute bottom-4 left-5 flex items-end gap-4 md:bottom-6 md:left-8">
            <Image
              src="/brand/x-avatar-circle.png"
              alt="X avatar, circled"
              width={112}
              height={112}
              className="h-20 w-20 rounded-full ring-4 ring-[var(--bg)] md:h-28 md:w-28"
            />
            <div className="mb-1 hidden sm:block">
              <p className="serif text-2xl">OUTRANK</p>
              <p className="mono text-[13px] text-[var(--cyan)]">@outrankcoach</p>
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <a href="/brand/x-avatar-dither.jpg" className="card p-5">
            <p className="mono text-[12px] text-[var(--gold)]">Avatar · 400×400</p>
            <Image
              src="/brand/x-avatar-dither.jpg"
              alt="Dithered avatar"
              width={400}
              height={400}
              className="mt-4 w-full max-w-[240px]"
            />
            <p className="mt-3 text-sm text-[var(--muted)]">
              x-avatar-dither.jpg · how it looks in the circle is above
            </p>
          </a>
          <a href="/brand/x-banner-dither.jpg" className="card p-5">
            <p className="mono text-[12px] text-[var(--gold)]">Banner · 1500×500</p>
            <Image
              src="/brand/x-banner-dither.jpg"
              alt="Dithered banner"
              width={1500}
              height={500}
              className="mt-4 w-full"
            />
            <p className="mt-3 text-sm text-[var(--muted)]">
              x-banner-dither.jpg · click for the full file
            </p>
          </a>
        </div>

        <p className="mt-6 text-sm text-[var(--muted)]">
          Clean (no dither) if you want them:{" "}
          <a href="/brand/x-avatar.jpg" className="text-[var(--cyan)] underline">
            avatar
          </a>
          {" · "}
          <a href="/brand/x-banner.jpg" className="text-[var(--cyan)] underline">
            banner
          </a>
          . Use the dithered pair.
        </p>

        <hr className="sparkle-hr my-16" />

        <p className="mono text-[13px] text-[var(--gold)]">Other tiles</p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {NIGHT.map((m) => (
            <a key={m.id} href={m.src} className="card overflow-hidden">
              <Image
                src={m.src}
                alt={m.name}
                width={900}
                height={900}
                className="aspect-square w-full object-cover"
              />
              <div className="p-5">
                <p className="mono text-[12px] text-[var(--gold)]">
                  {m.id} · {m.name}
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {m.note}
                </p>
              </div>
            </a>
          ))}
        </div>
        <p className="mt-12 text-sm">
          <Link href="/" className="text-[var(--cyan)] underline">
            Back
          </Link>
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
