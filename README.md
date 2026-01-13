# Activhome Server Switcher

**Activhome Server Switcher** is a custom Home Assistant Lovelace card designed to seamlessly switch between Home Assistant instances.

The card automatically adapts navigation depending on the device:
- **Desktop / browser** → classic HTTP(S) URL
- **iPad / tablet (Home Assistant Companion)** → `homeassistant://navigate/...`

It provides a polished UI, a stable visual editor, and full compatibility with dark mode.

---

## Features

- Automatic device-based navigation (desktop vs Companion)
- Fully visual editor with stable input focus
- Dark / light mode compatible dropdowns and inputs
- Active server detection with visual badge
- Consistent card height (edition / display)
- Custom style presets (Activhome, glass, neon, etc.)
- Optional confirmation before switching server
- Optional display of full target URL
- Default grid size (`rows: 2`) for consistent layouts

---

## Installation

1. Copy `activhome-server-switcher.js` into:
   ```
   /config/www/
   ```

2. Add the resource in Home Assistant:
   - URL: `/local/activhome-server-switcher.js`
   - Type: `Module`

3. Add the card:
   ```yaml
   type: custom:activhome-server-switcher
   ```

---

## Device behavior

- **Desktop**: navigates using the configured desktop URL
- **iPad / tablet**: opens the Home Assistant Companion app using `homeassistant://navigate`

---

## Status

✅ Stable – production ready  
Built and validated in real-world Home Assistant dashboards.
