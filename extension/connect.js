const API_CANDIDATES = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://penguin.linux.test:3000",
];

async function probeApi(base) {
  const url = `${base.replace(/\/$/, "")}/api/billing/status`;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = await res.json();
    return { base: base.replace(/\/$/, ""), data };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function findApi(preferred) {
  const ordered = [
    preferred,
    ...API_CANDIDATES.filter((u) => u !== preferred),
  ].filter(Boolean);
  for (const base of ordered) {
    const hit = await probeApi(base);
    if (hit) return hit;
  }
  return null;
}

if (typeof window !== "undefined") {
  window.OutrankConnect = { API_CANDIDATES, probeApi, findApi };
}
