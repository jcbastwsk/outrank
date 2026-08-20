"use client";

import { useState } from "react";

export function AlertSignup() {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy();
    try {
      const res = await fetch("/api/alerts/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error === "bad_email" ? "That is not an email." : "Could not save.");
      }
      setState("ok");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save.");
      setState("err");
    }
  }

  function setBusy() {
    setState("busy");
    setErr(null);
  }

  if (state === "ok") {
    return (
      <p className="text-sm leading-6">
        On the list. You get mail when a published default moves. Nothing
        else.
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="space-y-3">
      <input
        type="text"
        name="company"
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="field flex-1 px-3 py-2 text-sm"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={state === "busy"}
          className="btn-gold px-4 py-2 text-sm disabled:opacity-50"
        >
          {state === "busy" ? "…" : "Get the play"}
        </button>
      </div>
      {err && <p className="text-xs text-[var(--bad)]">{err}</p>}
      <p className="text-xs leading-5 text-[var(--muted)]">
        Algo-change only. Not a newsletter. One email when a weight moves,
        with the play and a link to the table. Unsub on every mail.
      </p>
    </form>
  );
}
