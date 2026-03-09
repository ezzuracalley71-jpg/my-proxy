# Nexus Proxy

<p align="center">
  <img src="./public/assets/nexus-ui-2.png" alt="Nexus logo" width="560" />
</p>

A fast, private web proxy with a modern UI and configurable browsing settings.
This project is built on top of the Ultraviolet ecosystem and related MercuryWorkshop tooling.

## What This Proxy Includes

- Modern Nexus UI with custom branding and responsive layout
- Multiple proxy modes (Ultraviolet + Bare Server selection)
- In-app settings panel (appearance, cloaking, privacy, proxy controls)
- Tab cloaking (custom title + favicon presets/custom URL)
- About:blank popup mode support
- Built-in ad-block domain list exposed via API
- Optional lock screen/PIN flow and panic-style controls

## How It Works

- Static frontend is served from `public/`
- Proxy vendor assets are mounted under:
  - `/uv/`
  - `/epoxy/`
  - `/baremux/`
- WebSocket upgrades are handled for Wisp at `/wisp/`
- Server sets strict no-cache headers by default

## Configuration And Data

- Runtime port:
  - `PORT` environment variable (defaults to `8080`)
- User-facing settings are persisted in browser local storage
- Global server settings endpoint:
  - `GET /api/global-settings`
- Ad block list endpoint:
  - `GET /api/ad-block-list`
- Optional global settings file path:
  - `public/settings.json`

## Quick Start (Local)

```bash
npm install
npm start
```

Then open http://localhost:8080 in your browser (use Chromium for localhost testing; Firefox needs HTTPS).

## Deployment

Use your preferred Node.js host (Railway, Replit, Koyeb, VPS, etc.) and run the app with:

```bash
npm install
npm start
```

If you need platform-specific deployment help, use your provider's standard Node.js deployment flow.

> [!IMPORTANT]  
> Until deployed on a domain with a valid SSL certificate, Firefox will not be able to load the site. Use chromium for testing on localhost
