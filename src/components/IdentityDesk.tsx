"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { analyzeAvatar, type AvatarResult } from "../lib/avatar";
import { noAutofill } from "../lib/autofill";
import { HANDLE_KEY, saveHandle, type HandleKind } from "../lib/handle";
import {
  emptyIdentity,
  loadIdentity,
  saveIdentity,
  workshopIdentity,
  type Identity,
} from "../lib/identity";

const OVERRIDES: { id: HandleKind; label: string }[] = [
  { id: "named", label: "Person" },
  { id: "anon", label: "Anon" },
  { id: "fan", label: "Fan" },
  { id: "corp", label: "Brand" },
];

function scoreFile(file: File): Promise<{ url: string; result: AvatarResult }> {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(blobUrl);
      const size = 256;
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        reject(new Error("No canvas"));
        return;
      }
      const side = Math.min(img.naturalWidth, img.naturalHeight);
      ctx.drawImage(
        img,
        (img.naturalWidth - side) / 2,
        (img.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        size,
        size,
      );
      resolve({
        url: canvas.toDataURL("image/jpeg", 0.84),
        result: analyzeAvatar(ctx.getImageData(0, 0, size, size)),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Could not read that image"));
    };
    img.src = blobUrl;
  });
}

export function IdentityDesk() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [id, setId] = useState<Identity>(emptyIdentity);
  const [avatar, setAvatar] = useState<AvatarResult | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = loadIdentity();
    const handle = localStorage.getItem(HANDLE_KEY) ?? "";
    const next = stored ?? emptyIdentity();
    if (handle && !next.handle) next.handle = handle;
    setId(next);
    setReady(true);
  }, []);

  const persist = useCallback((next: Identity) => {
    const stamped = { ...next, updatedAt: new Date().toISOString() };
    setId(stamped);
    saveIdentity(stamped);
    if (stamped.handle) saveHandle(stamped.handle);
  }, []);

  const shop = useMemo(() => workshopIdentity(id, avatar), [id, avatar]);

  function patch(partial: Partial<Identity>) {
    persist({ ...id, ...partial });
  }

  async function onPfp(file: File) {
    const scored = await scoreFile(file);
    setAvatar(scored.result);
    persist({
      ...id,
      avatarDataUrl: scored.url,
      avatarGrade: scored.result.grade,
      avatarReach: scored.result.reach,
    });
  }

  if (!ready) return null;

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="card space-y-4 p-5">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
          The chrome
        </p>
        <Field label="Display name">
          <input
            {...noAutofill}
            className="field px-3 py-2 text-sm"
            value={id.name}
            maxLength={50}
            placeholder="What they can say out loud"
            onChange={(e) => patch({ name: e.target.value })}
          />
        </Field>
        <Field label="@">
          <input
            {...noAutofill}
            className="field px-3 py-2 text-sm"
            value={id.handle}
            placeholder="@you"
            spellCheck={false}
            onChange={(e) => patch({ handle: e.target.value })}
          />
          <div className="mt-2 flex flex-wrap gap-1">
            {OVERRIDES.map((o) => (
              <button
                key={o.id}
                type="button"
                suppressHydrationWarning
                className="chip px-2 py-1 text-[11px]"
                data-active={
                  (id.handleOverride ?? shop.handle.kind) === o.id
                }
                onClick={() =>
                  patch({
                    handleOverride:
                      id.handleOverride === o.id ? undefined : o.id,
                  })
                }
              >
                {o.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label={`Bio · ${id.bio.length}/160`}>
          <textarea
            {...noAutofill}
            className="field min-h-24 p-3 text-sm leading-6"
            value={id.bio}
            maxLength={200}
            placeholder="One sentence they can remember. Not a CTA."
            onChange={(e) => patch({ bio: e.target.value })}
          />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Location">
            <input
              {...noAutofill}
              className="field px-3 py-2 text-sm"
              value={id.location}
              placeholder="optional"
              onChange={(e) => patch({ location: e.target.value })}
            />
          </Field>
          <Field label="Website">
            <input
              {...noAutofill}
              className="field px-3 py-2 text-sm"
              value={id.website}
              placeholder="https://"
              onChange={(e) => patch({ website: e.target.value })}
            />
          </Field>
        </div>
        <Field label="PFP">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onPfp(file);
            }}
          />
          <button
            type="button"
            suppressHydrationWarning
            className="btn-ghost px-3 py-2 text-sm"
            onClick={() => fileRef.current?.click()}
          >
            {id.avatarDataUrl ? "Replace circle" : "Score a circle"}
          </button>
        </Field>
        <Field label="Pinned post">
          <textarea
            {...noAutofill}
            className="field min-h-28 p-3 text-sm leading-6"
            value={id.pinned}
            placeholder="The one free original a cold visitor gets."
            onChange={(e) => patch({ pinned: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-5">
        <ProfilePreview id={id} shopHandle={shop.handle.display} />
        <div className="card p-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--gold)]">
            {shop.fit} · {shop.desk}
          </p>
          <p className="serif mt-2 text-3xl">{shop.headline}</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {shop.pieces.map((p) => (
              <li key={p.id} className="chip px-2 py-1 text-xs">
                {p.label} · {p.read}
              </li>
            ))}
          </ul>
          {id.avatarDataUrl && (
            <div className="mt-4 flex items-center gap-3">
              {[80, 48, 32].map((n) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={n}
                  src={id.avatarDataUrl}
                  alt=""
                  width={n}
                  height={n}
                  className="object-cover"
                  style={{ width: n, height: n, borderRadius: 999 }}
                />
              ))}
              {id.avatarGrade && (
                <span className="mono text-xs text-[var(--muted)]">
                  chip {id.avatarGrade} {id.avatarReach}
                </span>
              )}
            </div>
          )}
          <ul className="mt-5 space-y-3">
            {shop.plays.map((p) => (
              <li key={p.id} className="panel p-4">
                <h3 className="text-[15px] font-medium">{p.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{p.why}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
            This is not a Phoenix score. ProfileClickWeight is 0. We are asking
            whether the chrome is one desk — name, @, bio, circle, pin — so a
            viewer does not meet three costumes.
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function ProfilePreview({ id, shopHandle }: { id: Identity; shopHandle: string }) {
  return (
    <div className="card overflow-hidden">
      <div className="h-20 bg-[linear-gradient(90deg,#2a0a4a,#0a001c,#1a0838)]" />
      <div className="px-5 pb-5">
        {id.avatarDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={id.avatarDataUrl}
            alt=""
            width={72}
            height={72}
            className="-mt-9 object-cover"
            style={{
              width: 72,
              height: 72,
              borderRadius: 999,
              border: "3px solid #14002c",
            }}
          />
        ) : (
          <div
            className="-mt-9 bg-[#1a0838]"
            style={{ width: 72, height: 72, borderRadius: 999, border: "3px solid #14002c" }}
          />
        )}
        <p className="serif mt-3 text-2xl">{id.name || "Display name"}</p>
        <p className="mono text-sm text-[var(--cyan)]">
          {shopHandle || "@handle"}
        </p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          {id.bio || "Bio goes here."}
        </p>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {[id.location, id.website].filter(Boolean).join(" · ") || "location · website"}
        </p>
      </div>
    </div>
  );
}
