"use client";

import { useEffect, useState } from "react";

type State = "wait" | "missing" | "ok";

export function ExtensionAttach({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<State>("wait");
  const [plan, setPlan] = useState("scout");

  useEffect(() => {
    const t = window.setTimeout(() => {
      setState((s) => (s === "wait" ? "missing" : s));
    }, 700);
    function onAttached(e: Event) {
      const detail = (e as CustomEvent<{ plan?: string }>).detail;
      setPlan(detail?.plan ?? "scout");
      setState("ok");
    }
    window.addEventListener("outrank:attached", onAttached);
    window.dispatchEvent(new Event("outrank:attach"));
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("outrank:attached", onAttached);
    };
  }, []);

  if (compact) {
    if (state !== "ok") return null;
    return (
      <span className="tab text-[var(--cyan)]" title="Chrome extension attached">
        ext · {plan}
      </span>
    );
  }

  if (state === "ok") {
    return (
      <p className="panel mt-6 px-4 py-3 text-sm leading-6">
        <span className="mono text-[var(--cyan)]">Extension attached.</span>{" "}
        Scores on x.com will use your{" "}
        <span className="text-[var(--ink)]">{plan}</span> plan.
      </p>
    );
  }

  return (
    <p className="panel mt-6 px-4 py-3 text-sm leading-6 text-[var(--muted)]">
      {state === "wait"
        ? "Looking for the Chrome extension…"
        : "Load the Chrome extension, then reload this tab. It will pick up your plan and use it on x.com."}
    </p>
  );
}
