# Nexus Proxy

<p align="center">
  <img src="./public/assets/nexus-ui-2.png" alt="Nexus logo" width="560" />
</p>

A fast, private web proxy with a modern UI and configurable browsing settings.
This project is built on top of the Ultraviolet ecosystem and related MercuryWorkshop tooling.

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

## Credits

- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
- [EpoxyTransport](https://github.com/MercuryWorkshop/EpoxyTransport)
- [bare-mux](https://github.com/MercuryWorkshop/bare-mux)
- [wisp-server-node](https://github.com/MercuryWorkshop/wisp-server-node)
