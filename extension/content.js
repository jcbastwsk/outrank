(() => {
  const FALLBACKS = [
    "https://www.outrank.coach",
    "https://outrank.coach",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://penguin.linux.test:3000",
  ];
  let apiBase = FALLBACKS[0];
  let lastText = "";
  let timer = null;
  let root = null;

  chrome.storage?.sync?.get({ apiBase: FALLBACKS[0] }, (cfg) => {
    if (cfg?.apiBase) apiBase = cfg.apiBase.replace(/\/$/, "");
  });

  function ensurePanel() {
    if (root) return root;
    root = document.createElement("aside");
    root.id = "outrank-root";
    root.innerHTML = `
      <div class="or-card">
        <div class="or-head">
          <span>Outrank</span>
          <button class="or-btn" type="button" data-or="hide">hide</button>
        </div>
        <div class="or-body" data-or="body">
          <p class="or-muted">Start typing a post. We score it against the published For You weights.</p>
        </div>
      </div>
    `;
    document.documentElement.appendChild(root);
    root.querySelector("[data-or=hide]")?.addEventListener("click", () => {
      root.style.display = "none";
    });
    return root;
  }

  function render(state) {
    const body = ensurePanel().querySelector("[data-or=body]");
    if (!body) return;
    if (state.error) {
      body.innerHTML = `<p class="or-muted">${escapeHtml(state.error)}</p>`;
      return;
    }
    if (state.loading) {
      body.innerHTML = `<p class="or-muted">Scoring…</p>`;
      return;
    }
    const play = (state.plays && state.plays[0]) || null;
    const lane = state.lane?.label || "";
    const fmt = state.format || "";
    body.innerHTML = `
      ${
        state.accountRisk
          ? `<p class="or-risk"><strong>Do not nuke the account.</strong> We will not help you tune this.</p>`
          : ""
      }
      <div class="or-score">
        <b>${state.reach}</b>
        <span>${escapeHtml(state.grade || "")}${fmt ? ` · ${escapeHtml(fmt)}` : ""} · raw ${Number(state.rawScore).toFixed(2)}</span>
      </div>
      <p class="or-lane">${escapeHtml([lane, fmt].filter(Boolean).join(" · "))}</p>
      <p class="or-head-line">${escapeHtml(state.headline || "")}</p>
      ${
        play
          ? `<div class="or-play"><strong>${escapeHtml(play.title)}</strong>${escapeHtml(play.why)}</div>`
          : ""
      }
    `;
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function readComposer() {
    const nodes = document.querySelectorAll(
      '[data-testid="tweetTextarea_0"], [data-testid="tweetTextarea_1"]',
    );
    const texts = [];
    nodes.forEach((n) => {
      const t = (n.innerText || n.textContent || "").replace(/\n+/g, "\n").trim();
      if (t) texts.push(t);
    });
    return texts.join("\n\n");
  }

  async function resolveApi() {
    const ordered = [apiBase, ...FALLBACKS.filter((u) => u !== apiBase)];
    for (const base of ordered) {
      try {
        const res = await fetch(`${base}/api/billing/status`);
        if (res.ok) {
          apiBase = base;
          chrome.storage?.sync?.set({ apiBase: base });
          return base;
        }
      } catch {
        /* try next */
      }
    }
    return null;
  }

  async function analyze(text) {
    render({ loading: true });
    const base = await resolveApi();
    if (!base) {
      render({
        error:
          "Can't reach Outrank. Keep npm run dev running, then click the puzzle-piece icon and Save & test.",
      });
      return;
    }
    try {
      const res = await fetch(`${base}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.status === 402) {
        const data = await res.json().catch(() => ({}));
        render({
          error: data.message || "Scout daily limit hit. Upgrade to Pro for unlimited scores.",
        });
        return;
      }
      if (!res.ok) throw new Error(`Outrank API ${res.status}`);
      render(await res.json());
    } catch {
      render({
        error: "Outrank answered, then failed. Check the dashboard tab.",
      });
    }
  }

  function schedule() {
    const text = readComposer();
    if (text === lastText) return;
    lastText = text;
    if (!text) {
      render({
        error: "Start typing a post. We score it against the published For You weights.",
      });
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => analyze(text), 280);
  }

  const obs = new MutationObserver(() => schedule());
  obs.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
  });
  document.addEventListener("input", schedule, true);
  ensurePanel();
})();
