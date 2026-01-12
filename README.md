# Activhome Server Switcher

Activhome Server Switcher is a custom Lovelace card for Home Assistant that allows switching
between multiple Home Assistant instances directly from a dashboard.

It is designed for kiosk and wall-mounted setups where access to the sidebar,
Companion app server list, or gestures is not desirable.

## Key features

- Switch between multiple Home Assistant servers from a Lovelace card
- Works inside the Home Assistant app (iOS / Android) and kiosk mode
- Same-tab navigation (no external browser)
- Optional confirmation before switching
- Highlights the current server
- Minimal, sober UI compatible with Activhome dashboards

## Installation

Install via HACS as a custom repository:

iouribecq/activhome-server-switcher

Then reload the dashboard resources.

## Usage

type: custom:activhome-server-switcher
title: Serveurs
confirm: true
open_mode: same_tab
sites:
  - name: Maison
    url: https://maison.example.com/lovelace/accueil
    subtitle: Production
  - name: Seed
    url: https://seed.example.com/lovelace/accueil
    subtitle: Test

## Notes

- This card does not bypass authentication.
- Navigation remains inside the Home Assistant application when using same_tab.

## License

MIT
