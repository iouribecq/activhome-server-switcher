// activhome-server-switcher.js
// Activhome Server Switcher — custom Lovelace card (HACS)
// Includes a Lovelace UI editor to configure sites without YAML (critical for kiosk usage).
//
// Changes (focus + UX):
// - Fix instant focus loss in editor by avoiding full re-render on every keystroke.
// - Display prefers friendly name (subtitle) and makes URL display optional via `show_url` (default: false).

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
    show_url: false, // show host/path under each site (optional)
    // Optional (defaults keep current visuals)
    style_preset: "", // e.g. activhome|glass|dark_glass|neon_pulse...
    theme: "",        // HA theme name applied to this card container only
    accent_color: "", // used by neon/primary presets via --ah-accent-color
    card_style: "",   // advanced CSS injected into this card (targets ha-card)
    sites: [],
  };

  function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
  }

  function normalizeUrl(url) {
    const raw = (url ?? "").toString().trim();
    if (!raw) return null;

    // If user typed a host without scheme, assume https:// (common for HA cloud / reverse proxies).
    const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
    const candidate = hasScheme ? raw : `https://${raw}`;

    try {
      return new URL(candidate, window.location.href);
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

  // --- Optional Home Assistant theme support (per-card) ---------------------
  function _getThemeVars(hass, themeName) {
    const themes = hass?.themes?.themes;
    if (!themes || !themeName) return null;
    const theme = themes[themeName];
    if (!theme) return null;

    // Theme structure can be flat or { modes: { light: {...}, dark: {...} } }
    if (theme.modes && (theme.modes.light || theme.modes.dark)) {
      const modeKey = hass.themes?.darkMode ? "dark" : "light";
      return theme.modes[modeKey] || theme.modes.light || theme.modes.dark || null;
    }
    return theme;
  }

  function _clearTheme(el, prevVars) {
    if (!el || !prevVars) return;
    Object.keys(prevVars).forEach((k) => {
      const cssVar = k.startsWith("--") ? k : `--${k}`;
      el.style.removeProperty(cssVar);
    });
  }

  function _applyTheme(el, hass, themeName, prevVars) {
    const vars = _getThemeVars(hass, themeName);
    if (!vars) return null;

    _clearTheme(el, prevVars);

    Object.entries(vars).forEach(([key, val]) => {
      const cssVar = key.startsWith("--") ? key : `--${key}`;
      el.style.setProperty(cssVar, String(val));
    });
    return vars;
  }
  // -------------------------------------------------------------------------

  // --- Style presets (optional "fun" container looks) -----------------------
  // NOTE: Returning "" means "no changes" (keeps current visuals).
  function stylePresetCss(styleName) {
    const s = (styleName || "").trim().toLowerCase();
    if (!s || s === "none" || s === "default") return "";

    switch (s) {
      case "activhome":
        return `
          ha-card {
            --mdc-icon-size: 0px;
            --ha-card-padding: 14px;

            padding: var(--ha-card-padding) !important;

            background-color: rgba(0,0,0,0.40);
            border: 1px solid rgba(255,255,255,0.15);

            border-radius: 16px;
            box-shadow: none;
          }`;

      case "glass":
        return `
          ha-card{
            --mdc-icon-size: 0px;
            --ha-card-padding: 14px;

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
            --ha-card-padding: 14px;

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
            --ha-card-padding: 14px;

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
            padding: 14px;

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
                0 8px 20px rgba(0, 0, 0, 0.4);
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
            padding: 14px;

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

            padding: 14px;

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

            padding: 14px;

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

      default:
        return "";
    }
  }
  // -------------------------------------------------------------------------


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
        show_url: false,
        sites: [
          { name: "Maison", url: "https://maison.example.com/lovelace/accueil", subtitle: "Production" },
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
      const show_url = !!config.show_url;

      this._config = {
        ...DEFAULTS,
        ...config,
        open_mode,
        columns,
        show_url,
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
      const cfg = this._config || DEFAULTS;
      const n = cfg?.sites?.length || 1;

      // Home Assistant uses getCardSize() as a rough layout hint (masonry).
      // If it's too small, cards below can overlap when our internal grid wraps.
      // Use a conservative estimate: assume 2 columns unless user explicitly set 1.
      const cols = cfg.columns ? Math.max(1, Math.min(6, Number(cfg.columns))) : 2;
      const rows = Math.ceil(n / cols);

      // +1 for header/margins
      return Math.max(2, rows + 1);
    }

    _navigate(url) {
      const cfg = this._config || DEFAULTS;
      const mode = cfg.open_mode || "same_tab";

      const u = normalizeUrl(url);
      if (!u) {
        console.warn("[activhome-server-switcher] Invalid URL:", url);
        window.alert("URL invalide. Ajoute https:// si nécessaire.");
        return;
      }
      const href = u.href;

      if (cfg.confirm) {
        const text = isNonEmptyString(cfg.confirm_text) ? cfg.confirm_text : DEFAULTS.confirm_text;
        const ok = window.confirm(text);
        if (!ok) return;
      }

      if (mode === "new_tab") {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }


      // IMPORTANT: Home Assistant Companion (iOS) webview is tied to the currently selected server.
      // Trying to navigate the webview to a different HA instance (different origin) often "bounces" back.
      // In that case, we intentionally open the target in a new context instead (SafariView / external),
      // which is the most reliable user experience on iPhone/iPad.
      const ua = (navigator && navigator.userAgent) ? navigator.userAgent : "";
      const isCompanion = /HomeAssistant/i.test(ua) || /Home Assistant/i.test(ua);
      const currentOrigin = window.location && window.location.origin ? window.location.origin : "";
      const targetOrigin = u.origin;
      const targetHost = (u.hostname || "").toLowerCase();
      const isNabuCasa = targetHost === "ui.nabu.casa" || targetHost.endsWith(".ui.nabu.casa") || targetHost.endsWith(".nabu.casa");


      if (mode === "same_tab" && isCompanion && isNabuCasa && currentOrigin && targetOrigin && targetOrigin !== currentOrigin) {
        window.open(href, "_blank", "noopener,noreferrer");
        return;
      }

      // same_tab: stays inside HA app / kiosk webview.
      // iOS (Safari / HA Companion) is picky about navigation, especially toward external domains (e.g. Nabu Casa).
      // Best-effort order (all user-gesture friendly):
      // 1) window.open(..., '_self')  2) <a> click  3) location.assign
      try {
        const w = window.open(href, "_self");
        if (w) return;
      } catch (e) {
        // continue
      }

      try {
        const a = document.createElement("a");
        a.href = href;
        a.target = "_self";
        a.rel = "noopener noreferrer";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      } catch (e) {
        // continue
      }

      window.location.assign(href);
    }

    _render() {
      const root = this.shadowRoot;
      if (!root || !this._config) return;

      const cfg = this._config;

      const currentHost = window.location.host;
      const hass = this._hass;

            const presetCss = stylePresetCss(cfg.style_preset);
      const customCss = cfg.card_style ? `\n/* card_style */\n${cfg.card_style}\n` : "";

      const cols = cfg.columns
        ? cfg.columns
        : (() => {
            const n = cfg.sites.length;
            if (n <= 2) return 2;
            if (n === 3) return 2;
            if (n === 4) return 2;
            return 3;
          })();

      const itemsHtml = cfg.sites
        .map((s, idx) => {
          const host = hostOf(s.url);
          const isActive = host && host === currentHost;
          const path = pathnameOf(s.url);

          // Prefer friendly name (subtitle). If absent, show host as secondary.
          const friendly = s.subtitle || "";
          const hasFriendly = !!friendly;
          const secondary = hasFriendly ? friendly : host;

          // Avoid duplicating host when show_url is enabled and no friendly name:
          // - If friendly exists: show host + path on line3 (technical info).
          // - If no friendly: show only path (if any) on line3.
          const line3 = (() => {
            if (!cfg.show_url) return "";
            if (hasFriendly) {
              return `<div class="line3"><span class="host">${escapeHtml(host)}</span>${
                path && path !== "/" ? `<span class="sep">•</span><span class="path">${escapeHtml(path)}</span>` : ""
              }</div>`;
            }
            if (path && path !== "/") {
              return `<div class="line3"><span class="path">${escapeHtml(path)}</span></div>`;
            }
            return "";
          })();

          return `
            <button class="site ${isActive ? "active" : ""}" data-idx="${idx}" type="button">
              <div class="line1">
                <span class="name">${escapeHtml(s.name)}</span>
                ${isActive ? `<span class="badge">ACTIF</span>` : ""}
              </div>
              <div class="line2">
                <span class="secondary">${escapeHtml(secondary)}</span>
              </div>
              ${line3}
            </button>
          `;
        })
        .join("");

      root.innerHTML = `
        <style>
          :host { display:block; }
          ha-card { padding: 14px; }
          ${presetCss}
          ${customCss}

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

          .secondary { font-size: 12px; opacity: 0.86; }
          .sep { opacity: 0.6; }
          .host { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
          .path { opacity: 0.70; }

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

      // Optional per-card theme vars + accent color (applies to ha-card container only)
      const cardEl = root.querySelector("ha-card");
      if (cardEl) {
        const themeName = (cfg.theme || "").trim();
        if (themeName) {
          this._appliedThemeVars = _applyTheme(cardEl, hass, themeName, this._appliedThemeVars);
        } else if (this._appliedThemeVars) {
          _clearTheme(cardEl, this._appliedThemeVars);
          this._appliedThemeVars = null;
        }

        const acc = (cfg.accent_color || "").trim();
        if (acc) cardEl.style.setProperty("--ah-accent-color", acc);
        else cardEl.style.removeProperty("--ah-accent-color");
      }

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

    // Update local draft WITHOUT emitting config-changed.
    // Emitting config-changed on every keystroke makes Home Assistant re-create the editor
    // (or re-run setConfig), which causes the instant focus loss you observed.
    _updateValue(key, value) {
      if (!this._config) return;
      this._config[key] = value;
    }

    _updateSite(idx, patch) {
      if (!this._config) return;
      if (!Array.isArray(this._config.sites)) this._config.sites = [];
      const current = this._config.sites[idx] || {};
      this._config.sites[idx] = { ...current, ...patch };
    }

    // Commit changes to HA (triggers config update) — call on blur/change, not on each input.
    _commit() {
      this._emitConfigChanged();
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
      const themeNames = Object.keys(this._hass?.themes?.themes || {}).sort((a,b)=>a.localeCompare(b));
      const themeOptionsHtml = ['<option value="">(none)</option>']
        .concat(themeNames.map((t)=>`<option value="${escapeHtml(t)}" ${(cfg.theme||'')===t?'selected':''}>${escapeHtml(t)}</option>`))
        .join('');

      const presetOptions = [
        { label: 'Default (no preset)', value: '' },
        { label: 'Activhome', value: 'activhome' },
        { label: 'Glass', value: 'glass' },
        { label: 'Dark glass', value: 'dark_glass' },
        { label: 'Solid', value: 'solid' },
        { label: 'Neon Pulse', value: 'neon_pulse' },
        { label: 'Neon Glow', value: 'neon_glow' },
        { label: 'Primary + Breathe', value: 'primary_breathe' },
        { label: 'Primary Tint', value: 'primary_tint' },
      ];
      const presetOptionsHtml = presetOptions.map((o)=>`<option value="${o.value}" ${(cfg.style_preset||'')===o.value?'selected':''}>${o.label}</option>`).join('');

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
              Friendly name (optional)
              <input data-idx="${i}" data-field="subtitle" value="${escapeHtml(s?.subtitle ?? "")}" placeholder="Production / Test / Client ..." />
            </label>

            <label>
              URL
              <input data-idx="${i}" data-field="url" value="${escapeHtml(s?.url ?? "")}" placeholder="https://.../lovelace/..." />
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
          .row { display:flex; gap: 10px; align-items:center; flex-wrap: wrap; }
          label { display:flex; flex-direction:column; gap: 6px; font-size: 12px; opacity: .9; }
          :host { color-scheme: light dark; }

          input, select, textarea {
            font: inherit;
            padding: 10px 10px;
            border-radius: 10px;

            /* Use HA theme tokens so dark/light look consistent */
            border: 1px solid var(--divider-color, rgba(255,255,255,0.18));
            background: var(--input-fill-color,
              var(--card-background-color,
                var(--secondary-background-color, rgba(0,0,0,0.18))
              )
            );
            color: var(--primary-text-color, inherit);
            outline: none;
          }

          /* Selects: keep the control + popup menu readable in dark themes (Safari/iOS included) */
          select {
            -webkit-appearance: none;
            appearance: none;
            background-color: var(--input-fill-color,
              var(--card-background-color,
                var(--secondary-background-color, rgba(0,0,0,0.18))
              )
            );
          }

          /* Option list (works on many browsers; iOS uses native UI but this helps elsewhere) */
          select option, select optgroup {
            background: var(--card-background-color, var(--secondary-background-color, #111));
            color: var(--primary-text-color, #fff);
          }

          input:focus, select:focus, textarea:focus {
            border-color: rgba(255, 152, 0, 0.70);
          }
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
            <label style="flex:1; min-width: 220px;">
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

            <label style="width:160px">
              Show URL in card
              <select id="show_url">
                <option value="true" ${cfg.show_url ? "selected" : ""}>true</option>
                <option value="false" ${!cfg.show_url ? "selected" : ""}>false</option>
              </select>
            </label>

            <label style="min-width:220px">
              Style preset (optional)
              <select id="style_preset">
                ${presetOptionsHtml}
              </select>
            </label>

            <label style="min-width:220px">
              Theme (optional)
              <select id="theme">
                ${themeOptionsHtml}
              </select>
            </label>

            <label style="min-width:220px">
              Accent color (optional)
              <input id="accent_color" value="${escapeHtml(cfg.accent_color ?? "")}" placeholder="#00ffff" />
            </label>

          </div>

          <label>
            Confirm text
            <input id="confirm_text" value="${escapeHtml(cfg.confirm_text ?? DEFAULTS.confirm_text)}" placeholder="Changer de serveur ?" />
          </label>

          <div class="muted">
            Add your servers below. The card display prefers the <b>Friendly name</b>. URLs are optional to display (toggle above),
            but still required to switch.
          </div>

          ${sitesHtml}

          <button class="primary" id="addSite" type="button">Add site</button>
        </div>
      `;

      // Bind top-level fields (no rerender on input to avoid focus loss)
      root.getElementById("title")?.addEventListener("input", (e) => this._updateValue("title", e.target.value));
      root.getElementById("title")?.addEventListener("blur", () => this._commit());
      root.getElementById("confirm_text")?.addEventListener("input", (e) => this._updateValue("confirm_text", e.target.value));
      root.getElementById("confirm_text")?.addEventListener("blur", () => this._commit());

      root.getElementById("open_mode")?.addEventListener("change", (e) => {
        this._updateValue("open_mode", e.target.value);
        this._commit();
        this._render(); // select change is safe; keep UI consistent
      });
      root.getElementById("confirm")?.addEventListener("change", (e) => {
        this._updateValue("confirm", e.target.value === "true");
        this._commit();
        this._render();
      });
      root.getElementById("show_url")?.addEventListener("change", (e) => {
        this._updateValue("show_url", e.target.value === "true");
        this._commit();
        this._render();
      });

      root.getElementById("style_preset")?.addEventListener("change", (e) => {
        this._updateValue("style_preset", e.target.value);
        this._commit();
        this._render();
      });
      root.getElementById("theme")?.addEventListener("change", (e) => {
        this._updateValue("theme", e.target.value);
        this._commit();
        this._render();
      });
      root.getElementById("accent_color")?.addEventListener("input", (e) => this._updateValue("accent_color", e.target.value));
      root.getElementById("accent_color")?.addEventListener("blur", () => this._commit());
      root.getElementById("card_style")?.addEventListener("input", (e) => this._updateValue("card_style", e.target.value));
      root.getElementById("card_style")?.addEventListener("blur", () => this._commit());

      root.getElementById("addSite")?.addEventListener("click", () => this._addSite());

      // Bind site fields (no rerender on input to avoid focus loss)
      root.querySelectorAll("input[data-idx][data-field]").forEach((input) => {
        input.addEventListener("input", (e) => {
          const idx = Number(e.target.getAttribute("data-idx"));
          const field = e.target.getAttribute("data-field");
          this._updateSite(idx, { [field]: e.target.value });
        });

        // Commit only when the user leaves the field (prevents focus loss).
        input.addEventListener("blur", () => this._commit());
      });

      // Bind remove (rerender is intended)
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
