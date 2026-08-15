const input = document.getElementById("api");
const save = document.getElementById("save");
const statusEl = document.getElementById("status");
const dash = document.getElementById("dash");

function setStatus(ok, text) {
  statusEl.className = ok ? "ok" : "bad";
  statusEl.textContent = text;
}

async function applyBase(base) {
  input.value = base;
  dash.href = `${base}/app`;
  chrome.storage.sync.set({ apiBase: base });
}

async function refresh() {
  const stored = await chrome.storage.sync.get({ apiBase: "http://localhost:3000" });
  input.value = stored.apiBase;
  const hit = await window.OutrankConnect.findApi(stored.apiBase);
  if (!hit) {
    setStatus(false, "Can't reach Outrank. Is npm run dev running?");
    return;
  }
  await applyBase(hit.base);
  const plan = hit.data?.plan || "scout";
  setStatus(true, `Connected · ${plan}`);
}

save.addEventListener("click", async () => {
  const base = input.value.trim().replace(/\/$/, "") || "http://localhost:3000";
  await applyBase(base);
  const hit = await window.OutrankConnect.probeApi(base);
  if (hit) setStatus(true, `Connected · ${hit.data?.plan || "scout"}`);
  else setStatus(false, "Saved, but that URL did not answer.");
});

refresh();
