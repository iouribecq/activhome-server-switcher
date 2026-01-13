/* activhome-server-switcher.js
 *
 * Lovelace card: custom:activhome-server-switcher
 * Custom element: <activhome-server-switcher>
 *
 * Implementation WITHOUT LitElement / WITHOUT imports.
 * This prevents "Lit (LitElement/html/css) introuvable" issues.
 */

(function () {
  const CARD_TAG = "activhome-server-switcher";
  const EDITOR_TAG = "activhome-server-switcher-editor";

  const STYLE_PRESETS = [
    "activhome",
    "glass",
    "dark_glass",
    "solid",
    "neon_pulse",
    "neon_glow",
    "primary_breathe",
    "primary_tint",
    "transparent",
  ];

  // ---- Style presets (exactly as provided) ----
  function stylePresetCss(styleName) {
    const s = (styleName || "transparent").toLowerCase();
    switch (s) {
      case "activhome":
        return `
        ha-card {
          --mdc-icon-size: 0px;
          --ha-card-padding: 10px;

          padding: var(--ha-card-padding) !important;
          background-color: rgba(0,0,0,0.40);
          border: 1px solid rgba(255,255,255,0.15);

          border-radius: 12px;
          box-shadow: none;
        }`;

      case "glass":
        return `
        ha-card{
          --mdc-icon-size: 0px;
          --ha-card-padding: 10px;

          padding: var(--ha-card-padding) !important;

          background: rgba(255,255,255,0.10);
          border-radius: 16px;
          box-shadow: none;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
        }`;

      case "dark_glass":
        return `
        ha-card{
          --mdc-icon-size: 0px;
          --ha-card-padding: 10px;

          padding: var(--ha-card-padding) !important;
          border-radius: 16px;
          background: rgba(15, 15, 15, 0.55);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.12);
        }`;

      case "solid":
        return `
        ha-card{
          --mdc-icon-size: 0px;
          --ha-card-padding: 10px;

          padding: var(--ha-card-padding) !important;

          background: var(--card-background-color, rgba(0,0,0,0.2));
          border-radius: 16px;
          box-shadow: none;
        }`;

      case "neon_pulse":
        return `
        ha-card {
          border-radius: 16px;
          background: rgba(10, 10, 10, 0.45);
          padding: 8px 10px;

          backdrop-filter: blur(8px) brightness(1.1);
          -webkit-backdrop-filter: blur(8px) brightness(1.1);

          border: 1px solid rgba(255, 0, 180, 0.4);

          box-shadow:
            0 0 12px rgba(255, 0, 180, 0.5),
            0 0 24px rgba(255, 0, 180, 0.3),
            0 8px 20px rgba(0, 0, 0, 0.4);

          animation: ah_neon_pulse 12s linear infinite;
          transition:
            box-shadow 0.4s ease,
            border-color 0.4s ease,
            background 0.4s ease;

          will-change: box-shadow, border-color;
        }

        @keyframes ah_neon_pulse {
          0% {
            border-color: rgba(255, 0, 180, 0.5);
            box-shadow:
              0 0 12px rgba(255, 0, 180, 0.6),
              0 0 24px rgba(255, 0, 180, 0.35),
              0 8px 20px rgba(0, 0, 0, 0.4);
          }
          25% {
            border-color: rgba(0, 180, 255, 0.5);
            box-shadow:
              0 0 12px rgba(0, 180, 255, 0.6),
              0 0 24px rgba(0, 180, 255, 0.35),
              0 8px 20px rgba(0, 0, 0, 0.4);
          }
          50% {
            border-color: rgba(0, 255, 120, 0.5);
            box-shadow:
              0 0 12px rgba(0, 255, 120, 0.6),
              0 0 24px rgba(0, 255, 120, 0.35),
              0 8px 20px rgba(0,  0, 0, 0.4);
          }
          75% {
            border-color: rgba(255, 140, 0, 0.5);
            box-shadow:
              0 0 12px rgba(255, 140, 0, 0.6),
              0 0 24px rgba(255, 140, 0, 0.35),
              0 8px 20px rgba(0, 0, 0, 0.4);
          }
          100% {
            border-color: rgba(255, 0, 180, 0.5);
            box-shadow:
              0 0 12px rgba(255, 0, 180, 0.6),
              0 0 24px rgba(255, 0, 180, 0.35),
              0 8px 20px rgba(0, 0, 0, 0.4);
          }
        }`;

      case "neon_glow":
        return `
        ha-card{
          --ah-accent: var(--ah-accent-color, var(--primary-color, #00ffff));

          border-radius: 16px;
          background: rgba(10, 10, 10, 0.45);
          padding: 8px 10px;

          backdrop-filter: blur(6px) brightness(1.1);
          -webkit-backdrop-filter: blur(6px) brightness(1.1);

          border: 1px solid color-mix(in oklab, var(--ah-accent) 55%, transparent);

          box-shadow:
            0 0 10px color-mix(in oklab, var(--ah-accent) 55%, transparent),
            0 0 20px color-mix(in oklab, var(--ah-accent) 35%, transparent),
            0 8px 20px rgba(0, 0, 0, 0.4);

          transition: box-shadow 0.3s ease;
        }

        ha-card:hover{
          box-shadow:
            0 0 14px color-mix(in oklab, var(--ah-accent) 70%, transparent),
            0 0 26px color-mix(in oklab, var(--ah-accent) 45%, transparent),
            0 10px 24px rgba(0, 0, 0, 0.45);
        }`;

      case "primary_breathe":
        return `
        ha-card{
          --ah-accent: var(--ah-accent-color, var(--primary-color));

          border-radius: 16px;

          background: linear-gradient(
            120deg,
            color-mix(in oklab, var(--ah-accent) 20%, rgba(12,12,12,0.55)),
            rgba(12,12,12,0.55)
          );

          padding: 8px 10px;

          backdrop-filter: blur(8px) saturate(115%);
          -webkit-backdrop-filter: blur(8px) saturate(115%);

          border: 1px solid color-mix(in oklab, var(--ah-accent) 60%, transparent);

          box-shadow:
            0 0 10px color-mix(in oklab, var(--ah-accent) 40%, transparent),
            0 8px 20px rgba(0, 0, 0, 0.40);

          transition: box-shadow 0.25s ease, border-color 0.25s ease, background 0.25s ease;

          animation: ah_breathe 5.5s ease-in-out infinite;
          will-change: transform, box-shadow;
          transform: translateZ(0);
        }

        @keyframes ah_breathe {
          0% {
            box-shadow:
              0 0 10px color-mix(in oklab, var(--ah-accent) 40%, transparent),
              0 8px 20px rgba(0, 0, 0, 0.40);
            transform: translateZ(0) scale(1.00);
          }
          50% {
            box-shadow:
              0 0 18px color-mix(in oklab, var(--ah-accent) 65%, transparent),
              0 10px 24px rgba(0, 0, 0, 0.42);
            transform: translateZ(0) scale(1.01);
          }
          100% {
            box-shadow:
              0 0 10px color-mix(in oklab, var(--ah-accent) 40%, transparent),
              0 8px 20px rgba(0, 0, 0, 0.40);
            transform: translateZ(0) scale(1.00);
          }
        }`;

      case "primary_tint":
        return `
        ha-card{
          --ah-accent: var(--ah-accent-color, var(--primary-color));

          border-radius: 16px;

          background: linear-gradient(
            120deg,
            color-mix(in oklab, var(--ah-accent) 18%, rgba(12,12,12,0.55)),
            rgba(12,12,12,0.55)
          );

          padding: 8px 10px;

          backdrop-filter: blur(8px) saturate(115%);
          -webkit-backdrop-filter: blur(8px) saturate(115%);

          border: 1px solid color-mix(in oklab, var(--ah-accent) 65%, transparent);

          box-shadow:
            0 0 12px color-mix(in oklab, var(--ah-accent) 45%, transparent),
            0 8px 20px rgba(0, 0, 0, 0.40);

          transition:
            box-shadow 0.25s ease,
            border-color 0.25s ease,
            background 0.25s ease;
        }

        ha-card:hover{
          box-shadow:
            0 0 16px color-mix(in oklab, var(--ah-accent) 60%, transparent),
            0 10px 24px rgba(0, 0, 0, 0.42);

          border-color: color-mix(in oklab, var(--ah-accent) 80%, transparent);
        }`;

      case "transparent":
      default:
        return `
        ha-card{
          --mdc-icon-size: 0px;
          --ha-card-padding: 10px;

          padding: var(--ha-card-padding) !important;

          background: none;
          box-shadow: none;
          border: none;
          border-color: none;
        }`;
    }
  }

  function normalizeString(v) {
    return (v ?? "").toString();
  }

  function isCoarsePointer() {
    try {
      return window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    } catch (_e) {
      return false;
    }
  }

  function isMobileUA() {
    const ua = (navigator.userAgent || "").toLowerCase();
    return /iphone|ipad|ipod|android|mobile|tablet/.test(ua);
  }

  function shouldUseTabletPath() {
    return isCoarsePointer() || isMobileUA();
  }

  function safeParseUrl(url) {
    try {
      return new URL(url);
    } catch (_e) {
      return null;
    }
  }

  function isActiveServerByHost(desktopUrl) {
    const u = safeParseUrl(desktopUrl);
    if (!u) return false;
    return u.host === window.location.host;
  }

  function defaultConfig() {
    return {
      type: "custom:activhome-server-switcher",
      // Default grid sizing (when the dashboard/view layout supports grid_options)
      grid_options: {
        columns: 6,
        rows: 2,
      },
      title: "Serveur Home Assistant",
      style_preset: "activhome",
      theme: "",
      open_mode: "same_tab",
      confirm: false,
      confirm_text: "Changer de serveur?",
      show_full_url: false,
      accent_color: "",
      server: {
        name: "Chamonix",
        subtitle: "Maison principale",
        desktop_url: "http://192.168.1.33:8123",
        tablet_path: "homeassistant://navigate/parametres-affichage/0?server=Chamonix",
      },
    };
  }

  class ActivhomeServerSwitcher extends HTMLElement {
    constructor() {
      super();
      this._hass = null;
      this._config = null;
      this.attachShadow({ mode: "open" });
      this._onClick = this._onClick.bind(this);
    }

    set hass(hass) {
      this._hass = hass;
      this._render();
    }

    setConfig(config) {
      const base = defaultConfig();
      this._config = {
        ...base,
        ...(config || {}),
        grid_options: {
          ...(base.grid_options || {}),
          ...((config && config.grid_options) || {}),
        },
        server: {
          ...(base.server || {}),
          ...((config && config.server) || {}),
        },
      };
      this._render();
    }

    static getStubConfig() {
      return defaultConfig();
    }

    // Helps HA allocate a stable preview space in editor
    getCardSize() {
      return 1;
    }

    _resolveTargetUrl() {
      const cfg = this._config || defaultConfig();
      const s = cfg.server || {};
      const desktopUrl = normalizeString(s.desktop_url).trim();
      const tabletPath = normalizeString(s.tablet_path).trim();

      const preferTablet = shouldUseTabletPath();
      const candidate = preferTablet ? tabletPath : desktopUrl;
      const fallback = preferTablet ? desktopUrl : tabletPath;

      const target = candidate || fallback || "";
      return { target, desktopUrl, tabletPath };
    }

    _onClick() {
      if (!this._config) return;
      const cfg = this._config;
      const { target } = this._resolveTargetUrl();
      if (!target) return;

      if (cfg.confirm) {
        const msg = normalizeString(cfg.confirm_text).trim() || "Changer de serveur?";
        if (!window.confirm(msg)) return;
      }

      // Companion URL (iOS/Companion is picky: mimic HA url action)
      if (/^homeassistant:\/\//i.test(target)) {
        // 1) same as HA handle-action: window.open(url_path)
        try { window.open(target); } catch (e) {}
        // 2) fallback assign
        try { window.location.assign(target); } catch (e) {}
        // 3) last-resort: synthetic <a> click (still within user gesture)
        try {
          const a = document.createElement("a");
          a.href = target;
          a.rel = "noreferrer";
          a.style.display = "none";
          (this.shadowRoot || this).appendChild(a);
          a.click();
          a.remove();
        } catch (e) {}
        return;
      }

      // Classic URL
      const openMode = cfg.open_mode === "new_tab" ? "new_tab" : "same_tab";
      if (openMode === "new_tab") {
        window.open(target, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = target;
      }
    }

    _render() {
      if (!this.shadowRoot) return;
      if (!this._config) {
        this.shadowRoot.innerHTML = "";
        return;
      }

      const cfg = this._config;
      const s = cfg.server || {};
      const preset = (cfg.style_preset || "activhome").toLowerCase();
      const accent = normalizeString(cfg.accent_color).trim();
      const title = normalizeString(cfg.title);
      const name = normalizeString(s.name);
      const subtitle = normalizeString(s.subtitle);

      const { target, desktopUrl } = this._resolveTargetUrl();
      const active = isActiveServerByHost(desktopUrl);
      const fullUrlToShow = normalizeString(target);

      const themeAttr = normalizeString(cfg.theme).trim();

      // IMPORTANT: card always fills its container height
      // => active/inactive cannot differ in height
      const baseCss = `
        :host{ display:block; height:100%; }
        ha-card{ height:100%; min-height: var(--ah-switcher-min-height, 90px); box-sizing:border-box; cursor:pointer; user-select:none; -webkit-tap-highlight-color: transparent; }

        ${stylePresetCss(preset)}

        /* Active override (orange) */
        ${active ? `
          ha-card{
            border-color: rgba(255, 152, 0, 0.75) !important;
            background-color: rgba(255, 152, 0, 0.18) !important;
          }
        ` : ``}

        .wrap{ height:100%; display:flex; flex-direction:column; justify-content:center; gap:6px; }
        .top{ display:flex; align-items:center; justify-content:space-between; gap:10px; line-height:1; min-height: 18px; }
        .title{ font-size:14px; opacity:0.92; letter-spacing:0.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .badge{ font-size:12px; line-height:12px; padding:4px 8px; border-radius:999px; background: rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.15); white-space:nowrap; flex:0 0 auto; }
        .name{ font-size:20px; line-height:20px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .subtitle{ font-size:13px; line-height:16px; opacity:0.92; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .url{ font-size:12px; line-height:14px; opacity:0.75; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

        ha-card, .wrap, .title, .name, .subtitle, .url { color: var(--primary-text-color); }
      `;

      const styleVars = accent ? `--ah-accent-color: ${accent};` : "";

      this.shadowRoot.innerHTML = `
        <style>${baseCss}</style>
        <ha-card ${themeAttr ? `theme="${this._escapeAttr(themeAttr)}"` : ""} style="${this._escapeAttr(styleVars)}">
          <div class="wrap">
            <div class="top">
              <div class="title" title="${this._escapeAttr(title)}">${this._escapeHtml(title)}</div>
              ${active ? `<div class="badge">Actif</div>` : ``}
            </div>
            <div class="name" title="${this._escapeAttr(name)}">${this._escapeHtml(name)}</div>
            ${subtitle ? `<div class="subtitle" title="${this._escapeAttr(subtitle)}">${this._escapeHtml(subtitle)}</div>` : ``}
            ${cfg.show_full_url && fullUrlToShow ? `<div class="url" title="${this._escapeAttr(fullUrlToShow)}">${this._escapeHtml(fullUrlToShow)}</div>` : ``}
          </div>
        </ha-card>
      `;

      const card = this.shadowRoot.querySelector("ha-card");
      if (card) {
        card.removeEventListener("click", this._onClick);
        card.addEventListener("click", this._onClick);
      }
    }

    _escapeHtml(s) {
      return normalizeString(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    _escapeAttr(s) {
      // attribute-safe
      return this._escapeHtml(s);
    }

    static getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }

    getConfigElement() {
      return document.createElement(EDITOR_TAG);
    }
  }

  class ActivhomeServerSwitcherEditor extends HTMLElement {
    constructor() {
      super();
      this._hass = null;
      this._config = null;
      this.attachShadow({ mode: "open" });
      this._els = {};
    }

    set hass(hass) {
      this._hass = hass;
      this._updateThemeOptions();
    }

    setConfig(config) {
      const base = defaultConfig();
      this._config = {
        ...base,
        ...(config || {}),
        grid_options: {
          ...(base.grid_options || {}),
          ...((config && config.grid_options) || {}),
        },
        server: {
          ...(base.server || {}),
          ...((config && config.server) || {}),
        },
      };
      this._ensureUi();
      this._syncUiFromConfig();
    }

    _ensureUi() {
      if (!this.shadowRoot) return;
      if (this._els._built) return;

      const css = `
        :host{ display:block; padding:4px 0; }
        .section{ margin-bottom: 18px; }
        .section-title{ font-size:14px; opacity:0.8; margin:0 0 8px 0; font-weight:600; }
        .grid{ display:grid; grid-template-columns: 1fr; gap: 12px; }
        .row2{ display:grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        @media (max-width: 520px){ .row2{ grid-template-columns: 1fr; } }

        label{ display:block; font-size:12px; opacity:0.85; margin:0 0 6px 2px; }
        input, select{
          width:100%; box-sizing:border-box;
          padding: 10px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(0,0,0,0.12);
          color: var(--primary-text-color);
          outline: none;
          font: inherit;
        }
        select{ appearance: auto; }
        input:focus, select:focus{ border-color: rgba(255, 193, 7, 0.65); box-shadow: 0 0 0 2px rgba(255, 193, 7, 0.15); }

        .checkbox-row{ display:flex; align-items:center; gap: 10px; }
        .checkbox-row input[type="checkbox"]{ width: 18px; height: 18px; padding:0; margin:0; }
        .hint{ font-size:12px; opacity:0.75; margin-top: -6px; }
        .disabled{ opacity:0.55; }
      `;

      const field = (id, labelText, inputHtml) => `
        <div>
          <label for="${id}">${labelText}</label>
          ${inputHtml}
        </div>
      `;

      this.shadowRoot.innerHTML = `
        <style>${css}</style>

        <div class="section">
          <div class="section-title">Paramètres</div>
          <div class="grid">
            ${field("title", "Titre", `<input id="title" type="text" />`)}

            <div class="row2">
              ${field("style_preset", "Style preset", `<select id="style_preset"></select>`)}
              ${field("accent_color", "Accent (optionnel)", `<input id="accent_color" type="text" placeholder="#00ffff" />`)}
            </div>

            ${field("theme", "Thème (HA)", `<select id="theme"></select>`)}
            ${field("open_mode", "Ouverture", `<select id="open_mode">
              <option value="same_tab">Même onglet</option>
              <option value="new_tab">Nouvel onglet</option>
            </select>`)}

            <div class="checkbox-row">
              <input id="confirm" type="checkbox" />
              <label for="confirm" style="margin:0">Demande de confirmation</label>
            </div>

            ${field("confirm_text", "Texte de confirmation", `<input id="confirm_text" type="text" />`)}

            <div class="checkbox-row">
              <input id="show_full_url" type="checkbox" />
              <label for="show_full_url" style="margin:0">Afficher URL complète</label>
            </div>

            <div class="hint">Astuce : sur device tactile, la carte privilégie le lien Companion (homeassistant://...). Sinon, elle utilise l’URL classique.</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Serveur</div>
          <div class="grid">
            ${field("server_name", "Nom", `<input id="server_name" type="text" />`)}
            ${field("server_subtitle", "Sous-titre (optionnel)", `<input id="server_subtitle" type="text" />`)}
            ${field("server_desktop_url", "URL (desktop)", `<input id="server_desktop_url" type="text" />`)}
            ${field("server_tablet_path", "Chemin / URL (tablet Companion)", `<input id="server_tablet_path" type="text" />`)}
          </div>
        </div>
      `;

      const q = (id) => this.shadowRoot.querySelector(`#${id}`);

      // Cache elements
      this._els.title = q("title");
      this._els.style_preset = q("style_preset");
      this._els.accent_color = q("accent_color");
      this._els.theme = q("theme");
      this._els.open_mode = q("open_mode");
      this._els.confirm = q("confirm");
      this._els.confirm_text = q("confirm_text");
      this._els.show_full_url = q("show_full_url");
      this._els.server_name = q("server_name");
      this._els.server_subtitle = q("server_subtitle");
      this._els.server_desktop_url = q("server_desktop_url");
      this._els.server_tablet_path = q("server_tablet_path");

      // Populate preset options once
      this._els.style_preset.innerHTML = STYLE_PRESETS.map((p) => `<option value="${p}">${p}</option>`).join("");

      // Attach listeners once (NO rerender => stable focus)
      this._els.title.addEventListener("input", () => this._update("title", this._els.title.value));
      this._els.style_preset.addEventListener("change", () => this._update("style_preset", this._els.style_preset.value));
      this._els.accent_color.addEventListener("input", () => this._update("accent_color", this._els.accent_color.value));
      this._els.theme.addEventListener("change", () => this._update("theme", this._els.theme.value));
      this._els.open_mode.addEventListener("change", () => this._update("open_mode", this._els.open_mode.value));
      this._els.confirm.addEventListener("change", () => {
        this._update("confirm", this._els.confirm.checked);
        this._syncConfirmTextEnabled();
      });
      this._els.confirm_text.addEventListener("input", () => this._update("confirm_text", this._els.confirm_text.value));
      this._els.show_full_url.addEventListener("change", () => this._update("show_full_url", this._els.show_full_url.checked));

      this._els.server_name.addEventListener("input", () => this._update("server.name", this._els.server_name.value));
      this._els.server_subtitle.addEventListener("input", () => this._update("server.subtitle", this._els.server_subtitle.value));
      this._els.server_desktop_url.addEventListener("input", () => this._update("server.desktop_url", this._els.server_desktop_url.value));
      this._els.server_tablet_path.addEventListener("input", () => this._update("server.tablet_path", this._els.server_tablet_path.value));

      this._els._built = true;

      // Theme options based on hass
      this._updateThemeOptions();
    }

    _updateThemeOptions() {
      if (!this._els._built) return;
      const themeSelect = this._els.theme;
      if (!themeSelect) return;

      const current = themeSelect.value;
      const themesObj = (this._hass && this._hass.themes && this._hass.themes.themes) || {};
      const themes = Object.keys(themesObj).sort((a, b) => a.localeCompare(b));

      // Preserve selection if possible
      const options = [`<option value="">(aucun)</option>`].concat(themes.map((t) => `<option value="${this._escapeAttr(t)}">${this._escapeHtml(t)}</option>`));
      themeSelect.innerHTML = options.join("");

      // Restore selection
      themeSelect.value = (this._config && this._config.theme) ? this._config.theme : (current || "");
    }

    _syncUiFromConfig() {
      if (!this._els._built || !this._config) return;
      const cfg = this._config;
      const s = cfg.server || {};

      this._els.title.value = cfg.title || "";
      this._els.style_preset.value = cfg.style_preset || "activhome";
      this._els.accent_color.value = cfg.accent_color || "";
      this._els.open_mode.value = cfg.open_mode || "same_tab";

      // Theme (options may not yet exist)
      this._updateThemeOptions();
      this._els.theme.value = cfg.theme || "";

      this._els.confirm.checked = !!cfg.confirm;
      this._els.confirm_text.value = cfg.confirm_text || "Changer de serveur?";
      this._els.show_full_url.checked = !!cfg.show_full_url;

      this._els.server_name.value = s.name || "";
      this._els.server_subtitle.value = s.subtitle || "";
      this._els.server_desktop_url.value = s.desktop_url || "";
      this._els.server_tablet_path.value = s.tablet_path || "";

      this._syncConfirmTextEnabled();
    }

    _syncConfirmTextEnabled() {
      const enabled = !!(this._config && this._config.confirm);
      this._els.confirm_text.disabled = !enabled;
      this._els.confirm_text.parentElement.classList.toggle("disabled", !enabled);
    }

    _update(path, value) {
      if (!this._config) return;

      if (path.startsWith("server.")) {
        const k = path.slice("server.".length);
        this._config = {
          ...this._config,
          server: {
            ...(this._config.server || {}),
            [k]: value,
          },
        };
      } else {
        this._config = {
          ...this._config,
          [path]: value,
        };
      }

      this.dispatchEvent(
        new CustomEvent("config-changed", {
          detail: { config: this._config },
          bubbles: true,
          composed: true,
        })
      );
    }

    _escapeHtml(s) {
      return normalizeString(s)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    _escapeAttr(s) {
      return this._escapeHtml(s);
    }
  }

  // Register elements
  if (!customElements.get(CARD_TAG)) {
    customElements.define(CARD_TAG, ActivhomeServerSwitcher);
  }
  if (!customElements.get(EDITOR_TAG)) {
    customElements.define(EDITOR_TAG, ActivhomeServerSwitcherEditor);
  }

  // Lovelace discovery
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "activhome-server-switcher",
    name: "Activhome Server Switcher",
    description: "Switch server card (desktop URL + Companion navigate)",
  });

  // Compatibility: some HA builds look for this function on the element prototype
  ActivhomeServerSwitcher.prototype.getConfigElement = function () {
    return document.createElement(EDITOR_TAG);
  };

  // Some HA builds look for a static on the class
  ActivhomeServerSwitcher.getConfigElement = function () {
    return document.createElement(EDITOR_TAG);
  };
})();
