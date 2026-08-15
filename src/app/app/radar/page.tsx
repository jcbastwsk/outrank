import { ALGO_CHANGELOG } from "../../../lib/changelog";
import { ALGO_SOURCE, WEIGHT_ROWS } from "../../../lib/weights";
import { RadarClient } from "./radar-client";

export default function RadarPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="mono text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Radar</p>
        <h1 className="serif text-4xl">Every published move</h1>
        <p className="mt-2 max-w-2xl text-[var(--muted)]">
          We treat {ALGO_SOURCE.file} as a production config file. When X
          changes a default, the playbook changes.
        </p>
      </div>

      <RadarClient />

      <section className="space-y-4">
        {ALGO_CHANGELOG.map((ev) => (
          <article key={ev.date + ev.title} className="card p-6">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-[var(--muted)]">
              <span className="text-[var(--gold)]">{ev.date}</span>
              <span>{ev.impact}</span>
            </div>
            <h2 className="mt-2 text-2xl">{ev.title}</h2>
            <p className="mt-3 leading-7 text-[var(--muted)]">{ev.summary}</p>
            <p className="mt-3 leading-7">{ev.whatToDo}</p>
            <p className="mono mt-3 text-xs text-[var(--muted)]">{ev.source}</p>
          </article>
        ))}
      </section>

      <section className="card overflow-hidden">
        <div className="border-b border-[var(--line)] px-5 py-4 text-sm">
          Full snapshot · {WEIGHT_ROWS.length} published knobs
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-[11px] uppercase tracking-[0.12em] text-[var(--muted)]">
              <tr>
                <th className="px-5 py-3">Param</th>
                <th className="px-5 py-3">Value</th>
                <th className="px-5 py-3">Why it matters</th>
              </tr>
            </thead>
            <tbody>
              {WEIGHT_ROWS.map((w) => (
                <tr key={w.id} className="border-t border-[var(--line)] align-top">
                  <td className="px-5 py-3">
                    <div>{w.label}</div>
                    <div className="mono text-[11px] text-[var(--muted)]">{w.param}</div>
                  </td>
                  <td
                    className="mono px-5 py-3"
                    style={{
                      color:
                        w.kind === "negative"
                          ? "var(--bad)"
                          : w.kind === "boost"
                            ? "var(--gold)"
                            : "var(--ink)",
                    }}
                  >
                    {w.value}
                  </td>
                  <td className="px-5 py-3 text-[var(--muted)]">{w.meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
