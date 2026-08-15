"use client";

import { useCallback, useRef, useState } from "react";
import { analyzeAvatar, gradeColor, type AvatarResult } from "../lib/avatar";

function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image"));
    };
    img.src = url;
  });
}

function scoreImage(img: HTMLImageElement): { src: string; result: AvatarResult } {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("No canvas");
  const side = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = (img.naturalWidth - side) / 2;
  const sy = (img.naturalHeight - side) / 2;
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  const image = ctx.getImageData(0, 0, size, size);
  return { src: canvas.toDataURL("image/jpeg", 0.85), result: analyzeAvatar(image) };
}

export function AvatarDesk() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [result, setResult] = useState<AvatarResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async (file: File) => {
    setBusy(true);
    setErr(null);
    try {
      const img = await fileToImage(file);
      const next = scoreImage(img);
      setSrc(next.src);
      setResult(next.result);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not score that image");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="card p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          Avatar
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void run(file);
          }}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) void run(file);
          }}
          className="mt-3 flex min-h-44 w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--line)] bg-black/30 px-4 py-8 text-sm text-[var(--muted)] hover:border-[var(--cyan)] hover:text-[var(--ink)]"
        >
          {busy ? "Scoring…" : "Drop a square. We crop a circle."}
          <span className="mono text-[11px] text-[var(--gold)]">
            Stays in this browser
          </span>
        </button>
        {err && <p className="mt-3 text-sm text-[var(--bad)]">{err}</p>}

        {src && (
          <div className="mt-5 space-y-4">
            <p className="mono text-[12px] text-[var(--gold)]">
              How it sits in the chrome
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <ThumbRow src={src} theme="dark" />
              <ThumbRow src={src} theme="light" />
            </div>
          </div>
        )}
      </div>

      <div className="card p-5">
        {result ? (
          <>
            <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              Thumbnail index
            </p>
            <p className="serif mt-1 text-5xl" style={{ color: gradeColor(result.grade) }}>
              {result.reach}
              <span className="ml-2 text-2xl text-[var(--muted)]">{result.grade}</span>
            </p>
            <p className="mt-3 text-sm leading-6">{result.headline}</p>
            <div className="mt-5 space-y-2">
              {result.metrics.map((m) => (
                <div key={m.id}>
                  <div className="flex justify-between text-[13px]">
                    <span>{m.label}</span>
                    <span className="mono text-[var(--muted)]">
                      {Math.round(m.value * 100)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden bg-white/5">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.round(m.value * 100)}%`,
                        background: "var(--gold)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {result.plays.map((p) => (
                <li key={p.id} className="panel p-4">
                  <h3 className="text-[15px] font-medium">{p.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{p.why}</p>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{result.disclaimer}</p>
          </>
        ) : (
          <p className="text-sm leading-6 text-[var(--muted)]">
            ProfileClickWeight is 0. This is not a follow-from-PFP cheat. It is
            whether the 40px circle next to your reply still looks like you.
          </p>
        )}
      </div>
    </div>
  );
}

function ThumbRow({ src, theme }: { src: string; theme: "dark" | "light" }) {
  const dark = theme === "dark";
  return (
    <div
      className="panel p-3"
      style={{
        background: dark ? "#0a0a0c" : "#f4f1ea",
        color: dark ? "#f8f1ff" : "#16120c",
      }}
    >
      <p className="mono mb-2 text-[10px] uppercase tracking-[0.14em] opacity-60">
        {dark ? "Dark feed" : "Light feed"}
      </p>
      <div className="flex items-center gap-3">
        {[80, 48, 32].map((n) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={n}
            src={src}
            alt=""
            width={n}
            height={n}
            className="shrink-0 object-cover"
            style={{
              width: n,
              height: n,
              borderRadius: "999px",
              boxShadow: dark
                ? "0 0 0 1px rgba(255,255,255,0.12)"
                : "0 0 0 1px rgba(0,0,0,0.12)",
            }}
          />
        ))}
        <span className="text-[12px] leading-4 opacity-70">you, in the replies</span>
      </div>
    </div>
  );
}
