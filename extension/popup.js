const input = document.getElementById("api");
const save = document.getElementById("save");
const statusEl = document.getElementById("status");
const dash = document.getElementById("dash");
const attach = document.getElementById("attach");

function setStatus(ok, text) {
  statusEl.className = ok ? "ok" : "bad";
  statusEl.textContent = text;
}

function applyLinks(base) {
  dash.href = `${base}/app`;
  attach.href = `${base}/install`;
}

async function applyBase(base) {
  input.value = base;
  applyLinks(base);
  chrome.storage.sync.set({ apiBase: base });
}

function describe(hit) {
  const plan = hit.data?.plan || "scout";
  const attached = Boolean(hit.token) && hit.data?.attached !== false && hit.data?.error !== "bad_token";
  if (!hit.token) {
    return {
      ok: false,
      text: `API up · ${plan} not attached. Open the dashboard once.`,
    };
  }
  if (!attached) {
    return {
      ok: false,
      text: "Token expired. Open the dashboard once to reattach.",
    };
  }
  return { ok: true, text: `Attached · ${plan}` };
}

async function refresh() {
  const stored = await chrome.storage.sync.get({ apiBase: "https://www.outrank.coach" });
  input.value = stored.apiBase;
  applyLinks(stored.apiBase);
  const hit = await window.OutrankConnect.findApi(stored.apiBase);
  if (!hit) {
    setStatus(false, "Can't reach Outrank. Is npm run dev running?");
    return;
  }
  await applyBase(hit.base);
  const next = describe(hit);
  setStatus(next.ok, next.text);
}

save.addEventListener("click", async () => {
  const base = input.value.trim().replace(/\/$/, "") || "https://www.outrank.coach";
  await applyBase(base);
  const hit = await window.OutrankConnect.probeApi(base);
  if (hit) {
    const next = describe(hit);
    setStatus(next.ok, next.text);
  } else setStatus(false, "Saved, but that URL did not answer.");
});

refresh();
