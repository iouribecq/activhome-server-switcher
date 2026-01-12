// activhome-server-switcher.js
// Activhome Server Switcher — custom Lovelace card (HACS)
// Includes a Lovelace UI editor to configure sites without YAML (critical for kiosk usage).

(() => {
  const CARD_TAG = "activhome-server-switcher";
  const EDITOR_TAG = "activhome-server-switcher-editor";

  const DEFAULTS = {
    title: "Serveurs",
    confirm: true,
    confirm_text: "Changer de serveur ?",
    open_mode: "same_tab", // same_tab | new_tab
    columns: null, // number | null (auto)
    dense: false,
    sites: [],
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

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj ?? {}));
  }

  class ActivhomeServerSwitcher extends HTMLElement {
    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    static getStubConfig() {
      return {
        type: `custom:${CARD_TAG}`,
        title: "Serveurs",
        confirm: true,
        open_mode: "same_tab",
        sites: [
          { name: "Maison", url: "https://maison.example.com/lovelace/accueil", subtitle: "Prod" },
          { name: "Seed", url: "https://seed.example.com/lovelace/accueil", subtitle: "Test" },
        ],
      };
    }

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

      // same_tab: stays inside HA app / kiosk webview
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
        btn.addEventListener(
          "click",
          () => {
            const idx = Number(btn.getAttribute("data-idx"));
            const site = cfg.sites[idx];
            if (!site) return;
            this._navigate(site.url);
          },
          { passive: true }
        );
      });
    }
  }

  // --- Editor (UI) ---
  class ActivhomeServerSwitcherEditor extends HTMLElement {
    setConfig(config) {
      this._config = deepClone(config || { type: `custom:${CARD_TAG}`, ...DEFAULTS });
      if (!Array.isArray(this._config.sites)) this._config.sites = [];
      if (!this.shadowRoot) this.attachShadow({ mode: "open" });
      this._render();
    }

    set hass(hass) {
      this._hass = hass;
    }

    _emitConfigChanged() {
      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    }

    _setValue(key, value) {
      this._config = { ...this._config, [key]: value };
      this._emitConfigChanged();
      this._render();
    }

    _setSite(idx, patch) {
      const sites = Array.isArray(this._config.sites) ? [...this._config.sites] : [];
      sites[idx] = { ...(sites[idx] || {}), ...patch };
      this._config = { ...this._config, sites };
      this._emitConfigChanged();
      this._render();
    }

    _addSite() {
      const sites = Array.isArray(this._config.sites) ? [...this._config.sites] : [];
      sites.push({ name: "Nouveau site", url: "https://", subtitle: "" });
      this._config = { ...this._config, sites };
      this._emitConfigChanged();
      this._render();
    }

    _removeSite(idx) {
      const sites = Array.isArray(this._config.sites) ? [...this._config.sites] : [];
      sites.splice(idx, 1);
      this._config = { ...this._config, sites };
      this._emitConfigChanged();
      this._render();
    }

    _render() {
      const root = this.shadowRoot;
      if (!root) return;

      const cfg = this._config || { type: `custom:${CARD_TAG}`, ...DEFAULTS };
      const sites = Array.isArray(cfg.sites) ? cfg.sites : [];

      const sitesHtml = sites
        .map(
          (s, i) => `
        <div class="siteRow">
          <div class="rowHeader">
            <div class="rowTitle">Site ${i + 1}</div>
            <button class="danger" data-remove="${i}" type="button">Remove</button>
          </div>

          <div class="fields">
            <label>
              Name
              <input data-idx="${i}" data-field="name" value="${escapeHtml(s?.name ?? "")}" placeholder="Maison" />
            </label>

            <label>
              URL
              <input data-idx="${i}" data-field="url" value="${escapeHtml(s?.url ?? "")}" placeholder="https://.../lovelace/..." />
            </label>

            <label>
              Subtitle (optional)
              <input data-idx="${i}" data-field="subtitle" value="${escapeHtml(s?.subtitle ?? "")}" placeholder="Prod / Test" />
            </label>
          </div>
        </div>
      `
        )
        .join("");

      root.innerHTML = `
        <style>
          :host { display:block; padding: 8px 0; }
          .wrap { display:flex; flex-direction:column; gap: 12px; }
          .row { display:flex; gap: 10px; align-items:center; }
          label { display:flex; flex-direction:column; gap: 6px; font-size: 12px; opacity: .9; }
          input, select {
            font: inherit;
            padding: 10px 10px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.04);
            color: inherit;
            outline: none;
          }
          input:focus, select:focus { border-color: rgba(255, 152, 0, 0.55); }
          .siteRow {
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 14px;
            padding: 12px;
            background: rgba(255,255,255,0.02);
          }
          .rowHeader { display:flex; align-items:center; justify-content:space-between; margin-bottom: 10px; }
          .rowTitle { font-size: 13px; font-weight: 600; opacity: .95; }
          .fields { display:flex; flex-direction:column; gap: 10px; }
          button {
            font: inherit;
            padding: 8px 10px;
            border-radius: 10px;
            border: 1px solid rgba(255,255,255,0.15);
            background: rgba(255,255,255,0.04);
            color: inherit;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }
          button:hover { border-color: rgba(255,255,255,0.22); background: rgba(255,255,255,0.06); }
          button.danger { border-color: rgba(255,80,80,0.35); }
          button.primary { border-color: rgba(255,152,0,0.45); }
          .muted { font-size: 12px; opacity: .7; line-height: 1.35; }
        </style>

        <div class="wrap">
          <label>
            Title
            <input id="title" value="${escapeHtml(cfg.title ?? DEFAULTS.title)}" placeholder="Serveurs" />
          </label>

          <div class="row">
            <label style="flex:1">
              Open mode
              <select id="open_mode">
                <option value="same_tab" ${cfg.open_mode === "same_tab" ? "selected" : ""}>same_tab (recommended)</option>
                <option value="new_tab" ${cfg.open_mode === "new_tab" ? "selected" : ""}>new_tab</option>
              </select>
            </label>

            <label style="width:140px">
              Confirm
              <select id="confirm">
                <option value="true" ${cfg.confirm ? "selected" : ""}>true</option>
                <option value="false" ${!cfg.confirm ? "selected" : ""}>false</option>
              </select>
            </label>
          </div>

          <label>
            Confirm text
            <input id="confirm_text" value="${escapeHtml(cfg.confirm_text ?? DEFAULTS.confirm_text)}" placeholder="Changer de serveur ?" />
          </label>

          <div class="muted">
            Add your servers below. In kiosk mode, keep <b>open_mode = same_tab</b> to stay inside the Home Assistant app.
          </div>

          ${sitesHtml}

          <button class="primary" id="addSite" type="button">Add site</button>
        </div>
      `;

      // Bind top-level fields
      root.getElementById("title")?.addEventListener("input", (e) => this._setValue("title", e.target.value));
      root.getElementById("confirm_text")?.addEventListener("input", (e) => this._setValue("confirm_text", e.target.value));

      root.getElementById("open_mode")?.addEventListener("change", (e) => this._setValue("open_mode", e.target.value));
      root.getElementById("confirm")?.addEventListener("change", (e) => this._setValue("confirm", e.target.value === "true"));

      root.getElementById("addSite")?.addEventListener("click", () => this._addSite());

      // Bind site fields
      root.querySelectorAll("input[data-idx][data-field]").forEach((input) => {
        input.addEventListener("input", (e) => {
          const idx = Number(e.target.getAttribute("data-idx"));
          const field = e.target.getAttribute("data-field");
          this._setSite(idx, { [field]: e.target.value });
        });
      });

      // Bind remove
      root.querySelectorAll("button[data-remove]").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const idx = Number(e.target.getAttribute("data-remove"));
          this._removeSite(idx);
        });
      });
    }
  }

  if (!customElements.get(CARD_TAG)) customElements.define(CARD_TAG, ActivhomeServerSwitcher);
  if (!customElements.get(EDITOR_TAG)) customElements.define(EDITOR_TAG, ActivhomeServerSwitcherEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: CARD_TAG,
    name: "Activhome Server Switcher",
    description: "Kiosk-friendly server list to switch between multiple Home Assistant instances.",
  });
})();
