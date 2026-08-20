(() => {
  if (!document.querySelector('meta[name="outrank"]')) return;

  async function attach() {
    try {
      const stored = await chrome.storage.local.get({ apiToken: "" });
      const headers = { "Content-Type": "application/json" };
      if (stored.apiToken) headers.Authorization = `Bearer ${stored.apiToken}`;
      const res = await fetch("/api/billing/token", {
        method: "POST",
        headers,
        credentials: "same-origin",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.token) return;
      await chrome.storage.local.set({ apiToken: data.token });
      await chrome.storage.sync.set({
        apiBase: location.origin.replace(/\/$/, ""),
      });
      window.dispatchEvent(
        new CustomEvent("outrank:attached", {
          detail: { plan: data.plan || "scout" },
        }),
      );
    } catch {
      /* other localhost app, or extension context gone */
    }
  }

  window.addEventListener("outrank:attach", attach);
  attach();
})();
