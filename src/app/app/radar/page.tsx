import { radarEvents } from "../../../lib/changelog";
import {
  fetchLiveDiff,
  standingOrder,
  watchedKnobs,
} from "../../../lib/radar";
import { ALGO_SOURCE } from "../../../lib/weights";
import { RadarClient } from "./radar-client";

export const dynamic = "force-dynamic";

export default async function RadarPage() {
  const initial = await fetchLiveDiff();
  const standing = standingOrder();
  const knobs = watchedKnobs();
  const events = radarEvents();

  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">
          Radar
        </p>
        <h1 className="serif text-4xl">Published ranking numbers</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          X published the default scores it uses to rank posts, in{" "}
          {ALGO_SOURCE.file}. We keep a copy and check the public file for
          changes. These are not live settings for every viewer.
        </p>
      </div>

      <RadarClient initial={initial} />

      <section>
        <h2 className="serif text-2xl">Current numbers</h2>
        <div className="mt-4 overflow-hidden card">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Knob</th>
                <th className="px-5 py-3">Now</th>
                <th className="px-5 py-3">Order</th>
              </tr>
            </thead>
            <tbody>
              {standing.map((line) => (
                <tr key={line.knob} className="border-t border-[var(--line)] align-top">
                  <td className="px-5 py-3">{line.knob}</td>
                  <td className="mono px-5 py-3 text-[var(--gold)]">{line.value}</td>
                  <td className="px-5 py-3 text-[var(--muted)]">{line.order}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="serif text-2xl">Last moves</h2>
        {events.map((ev) => (
          <article key={ev.date + ev.title} className="card p-6">
            <div className="mono text-[12px] uppercase tracking-[0.14em] text-[var(--gold)]">
              {ev.date}
            </div>
            <h3 className="mt-2 text-xl">{ev.title}</h3>
            <p className="mt-3 leading-7 text-[var(--muted)]">{ev.summary}</p>
            <p className="mt-3 leading-7">{ev.whatToDo}</p>
          </article>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 text-sm">
          Watched knobs · {knobs.length}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Knob</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Play</th>
              </tr>
            </thead>
            <tbody>
              {knobs.map((k) => (
                <tr key={k.param} className="border-t border-[var(--line)] align-top">
                  <td className="px-5 py-3">
                    <div>{k.label}</div>
                    <div className="mono text-[11px] text-[var(--muted)]">{k.param}</div>
                  </td>
                  <td
                    className="mono px-5 py-3"
                    style={{
                      color:
                        k.kind === "negative"
                          ? "var(--bad)"
                          : k.kind === "boost"
                            ? "var(--gold)"
                            : "var(--ink)",
                    }}
                  >
                    {k.value}
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{k.play}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
