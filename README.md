# tmbom-studio

**ThreatModeler** — a TM-BOM studio for [CycloneDX](https://cyclonedx.org) **2.0** threat modeling.

Interactive workspace to build architecture blueprints, STRIDE threats, scenarios, and risks, then save a standards-aligned **Threat Model Bill of Materials** (`.cdx.json`).

- **Repo:** https://github.com/Mehrn0ush/tmbom-studio  
- **Try it (GitHub Pages):** https://mehrn0ush.github.io/tmbom-studio/  
- **Sample deep-link:** https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api  
- **Org guide:** [GUIDELINES.md](./GUIDELINES.md)  
- **License:** [Apache-2.0](./LICENSE)

Schemas follow the CycloneDX [`2.0-dev-threatmodeling`](https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling/schema/2.0) branch.

---

## What this is / isn’t

### This is

- A **browser workspace** for authoring CycloneDX 2.0 TM-BOM documents (`blueprints`, `threats`, `risks`)
- A way to **save/open `.cdx.json` files** and keep them in Git (see `projects/`)
- A **shareable sample** at [`examples/checkout-api.cdx.json`](./examples/checkout-api.cdx.json)
- Suitable for design workshops, AppSec reviews, and release evidence packages

### This isn’t

- A replacement for your GRC / risk-register platform
- A multi-user real-time collaboration server (yet)
- A complete implementation of every CycloneDX 2.0 construct (attack trees, full LINDDUN UI, BOM-Link automation, etc.)
- A final frozen standard — **CycloneDX 2.0 threat-modeling is still evolving** (`2.0-dev-threatmodeling`). Pin schemas, expect field changes, and re-validate exports when you upgrade.

---

## Features

| Area | Support |
| --- | --- |
| `blueprints` | Visual data-flow: assets, zones, trust boundaries, flows |
| `threats` | STRIDE catalog, methodologies, scenarios |
| `risks` | Statements, inherent/residual ratings, responses |
| Persistence | Save/Open project files (+ draft cache in `localStorage`) |
| Example | `examples/checkout-api.cdx.json` (also loadable in the UI) |

---

## Quick start

```bash
git clone https://github.com/Mehrn0ush/tmbom-studio.git
cd tmbom-studio
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

**Persistence tip:** use **Projects → Save project file…** and commit under `projects/<system>.cdx.json` (see [projects/README.md](./projects/README.md)). Do not treat browser storage as the system of record.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build |
| `npm run build:pages` | Production build with GitHub Pages base path |
| `npm run preview` | Preview production build |
| `npm run generate:example` | Regenerate `examples/checkout-api.cdx.json` |
| `npm run validate:example` | Structural + schema check of the sample TM-BOM |
| `npm run ci` | `build` + `validate:example` |

---

## CI & GitHub Pages

- **CI** (`.github/workflows/ci.yml`) runs `npm run build` and `npm run validate:example` on pushes and pull requests.
- **Pages** (`.github/workflows/pages.yml`) deploys `dist/` to GitHub Pages on pushes to `main`.

After the first push, enable Pages in the repo: **Settings → Pages → Source: GitHub Actions**.

---

## Roadmap (later)

- Multi-user / session export workflows
- Deeper LINDDUN and attack-tree editing
- BOM-Link integration with SBOMs / VEX

---

## Schema reference

Vendored under `schemas/2.0/` (including the bundled schema used in CI):

- `cyclonedx-2.0.schema.json`
- `cyclonedx-2.0-bundled.schema.json`
- `model/cyclonedx-blueprint-2.0.schema.json`
- `model/cyclonedx-threat-2.0.schema.json`
- `model/cyclonedx-risk-2.0.schema.json`

Upstream: https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling/schema/2.0

---

## Stack

React · TypeScript · Vite · Zustand · React Flow

## License

Copyright 2026 Mehrnoush. Licensed under the [Apache License 2.0](./LICENSE).
