// activhome-server-switcher.js
// Activhome Server Switcher — custom Lovelace card (HACS)
// Purpose: provide an in-dashboard "server list" to switch between multiple Home Assistant instances.
// Kiosk-friendly: no sidebar / no Companion server list needed.
//
// Config example:
// type: custom:activhome-server-switcher
// title: Serveurs
// confirm: true
// open_mode: same_tab   # same_tab | new_tab
// columns: 2            # optional (auto if omitted)
// sites:
//   - name: Maison
//     url: "https://maison.example.com/lovelace/accueil"
//     subtitle: "Production"     # optional
//   - name: Seed
//     url: "https://seed.example.com/lovelace/accueil"
//     subtitle: "Test"           # optional
//
// Notes:
// - Navigation happens inside the current WebView (Home Assistant app / Fully Kiosk / browser).
// - This card does NOT bypass authentication. If the target instance requires login, HA will show its login screen.

(() => {
  const CARD_TAG = "activhome-server-switcher";

  const DEFAULTS = {
    title: "Serveurs",
    confirm: true,
    confirm_text: "Changer de serveur ?",
    open_mode: "same_tab", // same_tab | new_tab
    columns: null, // number | null (auto)
    dense: false, // slightly smaller padding
  };

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function normalizeUrl(url) {
    try {
      return new URL(url, window.location.href);
    } catch (e) {
      return null;
    }
  }

  function hostOf(url) {
    const u = normalizeUrl(url);
    return u ? u.host : "";
  }

  function pathnameOf(url) {
    const u = normalizeUrl(url);
    return u ? u.pathname : "";
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  class ActivhomeServerSwitcher extends HTMLElement {
    setConfig(config) {
      if (!config) throw new Error("activhome-server-switcher: config is required");
      const sites = Array.isArray(config.sites) ? config.sites : [];
      if (sites.length === 0) throw new Error("activhome-server-switcher: 'sites' must be a non-empty array");

      const normalized = sites.map((s, idx) => {
        const name = s?.name;
        const url = s?.url;
        if (!isNonEmptyString(name)) throw new Error(`activhome-server-switcher: sites[${idx}].name is required`);
        if (!isNonEmptyString(url)) throw new Error(`activhome-server-switcher: sites[${idx}].url is required`);
        const u = normalizeUrl(url);
        if (!u) throw new Error(`activhome-server-switcher: sites[${idx}].url is not a valid URL`);
        return {
          name: String(name).trim(),
          url: u.toString(),
          subtitle: isNonEmptyString(s?.subtitle) ? String(s.subtitle).trim() : "",
        };
      });

      const open_mode = config.open_mode === "new_tab" ? "new_tab" : "same_tab";
      const columns = Number.isFinite(Number(config.columns)) ? Math.max(1, Math.min(6, Number(config.columns))) : null;

      this._config = {
        ...DEFAULTS,
        ...config,
        open_mode,
        columns,
        sites: normalized,
      };

      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
      if (!this._raf) {
        this._raf = requestAnimationFrame(() => {
          this._raf = null;
          this._render();
        });
      }
    }

    connectedCallback() {
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._render();
    }

    getCardSize() {
      const n = this._config?.sites?.length || 1;
      return Math.max(2, Math.ceil(n / 2));
    }

    _navigate(url) {
      const cfg = this._config || DEFAULTS;
      const mode = cfg.open_mode || "same_tab";

      if (cfg.confirm) {
        const text = isNonEmptyString(cfg.confirm_text) ? cfg.confirm_text : DEFAULTS.confirm_text;
        const ok = window.confirm(text);
        if (!ok) return;
      }

      if (mode === "new_tab") {
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      window.location.href = url;
    }

    _render() {
      const root = this.shadowRoot;
      if (!root || !this._config) return;

      const cfg = this._config;
      const currentHost = window.location.host;

      const cols = cfg.columns
        ? cfg.columns
        : (() => {
            const n = cfg.sites.length;
            if (n <= 2) return 2;
            if (n === 3) return 3;
            if (n === 4) return 2;
            return 3;
          })();

      const itemsHtml = cfg.sites
        .map((s, idx) => {
          const host = hostOf(s.url);
          const isActive = host && host === currentHost;

          const path = pathnameOf(s.url);
          const subtitle = s.subtitle || "";

          return `
            <button class="site ${isActive ? "active" : ""}" data-idx="${idx}" type="button">
              <div class="line1">
                <span class="name">${escapeHtml(s.name)}</span>
                ${isActive ? `<span class="badge">ACTIF</span>` : ""}
              </div>
              <div class="line2">
                <span class="host">${escapeHtml(host)}</span>
                ${subtitle ? `<span class="sep">•</span><span class="sub">${escapeHtml(subtitle)}</span>` : ""}
              </div>
              ${path && path !== "/" ? `<div class="line3">${escapeHtml(path)}</div>` : ""}
            </button>
          `;
        })
        .join("");

      root.innerHTML = `
        <style>
          :host { display:block; }
          ha-card { padding: 14px; }

          .header {
            display:flex;
            align-items:center;
            justify-content: space-between;
            margin-bottom: 10px;
          }
          .title {
            font-size: 16px;
            line-height: 18px;
            font-weight: 600;
            opacity: 0.95;
          }
          .meta {
            font-size: 12px;
            opacity: 0.7;
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(${cols}, minmax(0, 1fr));
            gap: 10px;
          }

          button.site {
            appearance: none;
            -webkit-appearance: none;
            border: 1px solid rgba(255,255,255,0.12);
            border-radius: 14px;
            background: rgba(255,255,255,0.04);
            color: inherit;
            text-align: left;
            padding: 12px 12px;
            cursor: pointer;
            user-select: none;

            display: flex;
            flex-direction: column;
            gap: 6px;
            min-height: 74px;

            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          button.site:hover { border-color: rgba(255,255,255,0.20); background: rgba(255,255,255,0.06); }
          button.site:active { transform: translateY(1px); }
          button.site:focus { outline: none; }

          button.site.active {
            border-color: rgba(255, 152, 0, 0.55);
            background: rgba(255, 152, 0, 0.10);
          }

          .line1 { display:flex; align-items:center; gap: 8px; }
          .name { font-size: 15px; font-weight: 600; }
          .badge {
            font-size: 11px;
            padding: 2px 8px;
            border-radius: 999px;
            border: 1px solid rgba(255, 152, 0, 0.60);
            color: rgba(255, 152, 0, 0.95);
          }

          .line2, .line3 {
            font-size: 12px;
            opacity: 0.78;
            display:flex;
            align-items:center;
            gap: 6px;
            flex-wrap: wrap;
          }
          .sep { opacity: 0.6; }
          .host { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .line3 { opacity: 0.60; }

          @media (max-width: 420px) {
            .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          }
        </style>

        <ha-card>
          <div class="header">
            <div class="title">${escapeHtml(cfg.title || DEFAULTS.title)}</div>
            <div class="meta">${escapeHtml(currentHost || "")}</div>
          </div>

          <div class="grid">${itemsHtml}</div>
        </ha-card>
      `;

      root.querySelectorAll("button.site").forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = Number(btn.getAttribute("data-idx"));
          const site = cfg.sites[idx];
          if (!site) return;
          this._navigate(site.url);
        }, { passive: true });
      });
    }
  }

  if (!customElements.get(CARD_TAG)) {
    customElements.define(CARD_TAG, ActivhomeServerSwitcher);
  }

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: "Activhome Server Switcher",
    description: "Kiosk-friendly server list to switch between multiple Home Assistant instances.",
  });
})();
