# tmbom-studio

**ThreatModeler** — a TM-BOM studio for [CycloneDX](https://cyclonedx.org) **2.0** threat modeling.

Interactive workspace to build architecture blueprints, STRIDE threats, scenarios, and risks, then save a standards-aligned **Threat Model Bill of Materials** (`.cdx.json`).

**Live app:** [https://mehrn0ush.github.io/tmbom-studio/](https://mehrn0ush.github.io/tmbom-studio/)  
**Sample:** [https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api](https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api)

[![CI](https://github.com/Mehrn0ush/tmbom-studio/actions/workflows/ci.yml/badge.svg)](https://github.com/Mehrn0ush/tmbom-studio/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](./LICENSE)

![tmbom-studio workspace](./docs/screenshot.svg)

- **Repo:** https://github.com/Mehrn0ush/tmbom-studio  
- **Org guide:** [GUIDELINES.md](./GUIDELINES.md)  
- **Pages how/why (blog):** [docs/blog/using-tmbom-studio-on-github-pages.md](./docs/blog/using-tmbom-studio-on-github-pages.md)  
- **Contributing:** [CONTRIBUTING.md](./CONTRIBUTING.md)  
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
- A frozen standard — **CycloneDX 2.0 threat-modeling is still evolving** (`2.0-dev-threatmodeling`). Pin schemas, expect field changes, and re-validate exports when you upgrade.

---

## CycloneDX 2.0 coverage

ThreatModeler targets the full [`2.0-dev-threatmodeling`](https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling) BOM surface. Vendored schemas live under [`schemas/2.0/`](./schemas/2.0/) ([sync notes](./schemas/SYNC.md)).

| Root section | UI | Notes |
| --- | --- | --- |
| `metadata`, `properties`, `externalReferences` | Overview, Links, Session | Workshop metadata + BOM-Link refs |
| `blueprints` | Blueprint | Assets, zones, boundaries, flows |
| `blueprints[].scope`, `assumptions` | Scope & assumptions | Model boundary + explicit assumptions |
| `threats` | Threats, CAPEC, Attack trees/paths, Abuse cases, Trust boundaries | Full threats section including methodologies |
| `controls` | Controls | Preventive/detective controls linked from risks |
| `definitions` | Definitions | Requirements, business objectives, use cases |
| `profiles` | Profiles | Threat (and data) profiles |
| `risks` | Risks, Scenarios | Ratings, status, responses → controls |
| `components` | Components | SBOM-style component inventory |
| `services`, `dependencies`, `compositions`, `vulnerabilities`, `annotations`, `citations`, `perspectives`, `formulation`, `declarations`, `signatures` | Advanced BOM | JSON round-trip editor for remaining root sections |

**Responsibility boundary (interim):** the spec has no normative per-threat in-scope field. ThreatModeler uses `threat.properties[]` with `cyclonedx:in-scope=true|false` (also reads legacy `asf:in-scope`) so library-style models can mark out-of-scope threats for downstream consumers.

---

## Features

| Area | Support |
| --- | --- |
| `blueprints` | Visual data-flow: assets, zones, trust boundaries, flows, scope, assumptions |
| `threats` | STRIDE + LINDDUN + MITRE ATT&CK; CAPEC 3.9; scenarios; attack trees/paths; abuse cases; trust boundaries; origin + in-scope |
| `controls` | Control catalog with category, status, applies-to |
| `definitions` | Requirements, business objectives, use cases |
| `profiles` | Threat profiles |
| `risks` | Statements, inherent/residual ratings, status, responses linked to controls |
| `components` | Component inventory (SBOM interchange) |
| `session` | Workshop participants + `.session.json` package export |
| `links` | BOM-Link URNs and SBOM / VEX external references |
| `advanced` | JSON editor for all other CycloneDX 2.0 root sections |
| `report` | Printable / Save-as-PDF risk summary + Markdown export for reviews |
| Persistence | Save/Open project files + recent drafts (+ `localStorage` cache) |
| Validation | Structural checks in the UI before save; sample checked in CI |
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

Or use the live app: [https://mehrn0ush.github.io/tmbom-studio/](https://mehrn0ush.github.io/tmbom-studio/)

### First 5 minutes in the UI

1. **Overview → Getting started** — name the system, create a zone, add an asset, suggest STRIDE threats, then open **Projects** to save.
2. Or skip ahead: click **Sample model** (sidebar) / open [`/?example=checkout-api`](https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api) to explore a full checkout API TM-BOM.
3. **Blueprint** — drag assets, draw flows across trust zones.
4. **Threats / Risks** — refine catalog entries and risk responses (link controls when ready).
5. **Report** — Print/PDF or **Download .md** for stakeholders; **Projects** — save `*.cdx.json` and commit under `projects/` (see [projects/README.md](./projects/README.md)).

**Persistence tip:** browser storage is only a draft cache. Prefer **Projects → Save project file…** as the system of record.

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Typecheck + production build |
| `npm run build:pages` | Production build with GitHub Pages base path |
| `npm run preview` | Preview production build |
| `npm run lint` | Oxlint |
| `npm run test` | Vitest unit tests |
| `npm run generate:example` | Regenerate `examples/checkout-api.cdx.json` |
| `npm run generate:capec` | Rebuild `src/data/capec-catalog.json` from vendored CAPEC 3.9 CSVs |
| `npm run validate:example` | Structural + schema check of the sample TM-BOM |
| `npm run ci` | `lint` + `test` + `build` + `validate:example` |

---

## CAPEC data

Vendored under [`data/capec/`](./data/capec/) from [CAPEC List Version 3.9](https://capec.mitre.org/data/downloads.html) ([MITRE Terms of Use](https://capec.mitre.org/about/termsofuse.html)):

| View | Name | Role in the app |
| ---: | --- | --- |
| 659 | OWASP Related Patterns | Default picker in Attack Patterns |
| 2000 | Comprehensive Dictionary | Full searchable catalog |
| 1000 | Mechanisms of Attack | Vendored CSV (hierarchy is in HTML/XML products) |
| 3000 | Domains of Attack | Vendored CSV (same rows as 1000 in 3.9 CSV export) |

The UI catalog is generated into `src/data/capec-catalog.json` (`npm run generate:capec`). ATT&CK technique IDs on patterns come from CAPEC taxonomy mappings where present.

---

## CI & GitHub Pages

- **CI** (`.github/workflows/ci.yml`) runs `lint`, `test`, `build`, and `validate:example` on pushes and pull requests.
- **Dependabot** (`.github/dependabot.yml`) opens weekly PRs for npm and GitHub Actions updates.
- **Pages** (`.github/workflows/pages.yml`) builds with `npm run build:pages` and **auto-deploys to the `gh-pages` branch** on every push to `main`.

One-time Pages setting (if the site is not live yet):

1. **[Settings → Pages](https://github.com/Mehrn0ush/tmbom-studio/settings/pages)**
2. Source: **Deploy from a branch**
3. Branch: **`gh-pages`** / **`/ (root)`** → Save

---

## Roadmap (later)

- Symmetric cross-links from risks / CAPEC / trees (not only threats)
- Guided SBOM remapping UI + richer BOM-Link editing
- Align sample + soft-fail gaps against evolving `2.0-dev` schema
- Real-time multi-user editing (beyond session packages)

Done recently (product layer, no spec change): CAPEC hierarchy browser, AJV-on-save with vendored schema deps, SBOM/diagram import, in-scope report/export, grouped nav, Pages CSP meta.

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
