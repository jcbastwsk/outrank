"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadStrategy, type StrategicProfile } from "../lib/strategy";

export function FieldRoom() {
  const [p, setP] = useState<StrategicProfile | null>(null);
  useEffect(() => {
    setP(loadStrategy());
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-[13px] text-[var(--gold)]">Field · X</p>
        <h1 className="serif mt-2 text-4xl">Territory, not a competitor grid</h1>
        <p className="mt-3 max-w-2xl text-[var(--muted)] leading-7">
          Peers, rivals, scenes, counterpublics. No live conversation graph is
          connected. What you see is what you named, plus the published ranker
          file if you want the weights.
        </p>
      </div>

      <section className="card p-6">
        <p className="mono text-[12px] text-[var(--gold)]">Observed · you stated</p>
        <h2 className="serif mt-2 text-2xl">Accounts in your territory</h2>
        {p?.territory.length ? (
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.territory.map((t) => (
              <li key={t}>
                <a
                  href={`https://x.com/${t}`}
                  target="_blank"
                  rel="noreferrer"
                  className="chip px-3 py-1 text-sm text-[var(--cyan)]"
                >
                  @{t}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-[var(--muted)]">
            Empty. Name accounts in{" "}
            <Link href="/start" className="text-[var(--cyan)] underline">
              onboarding
            </Link>
            .
          </p>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <p className="mono text-[11px] uppercase text-[var(--muted)]">
            Not connected
          </p>
          <h3 className="mt-2">Emerging language</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            We will not invent trending phrases. When the field watcher is
            live, they will be labeled observed.
          </p>
        </div>
        <div className="panel p-5">
          <p className="mono text-[11px] uppercase text-[var(--muted)]">
            Observed · public file
          </p>
          <h3 className="mt-2">Published ranker weights</h3>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
            The GitHub snapshot is not your audience. It is the physics of For
            You.
          </p>
          <Link href="/app/radar" className="mt-3 inline-block text-sm text-[var(--cyan)]">
            Open Radar →
          </Link>
        </div>
      </section>
    </div>
  );
}
