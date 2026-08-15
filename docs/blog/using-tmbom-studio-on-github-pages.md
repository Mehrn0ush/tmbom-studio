# Why (and how) to use tmbom-studio on GitHub Pages

**Audience:** AppSec facilitators, architects, and anyone evaluating CycloneDX TM-BOM tooling  
**Live app:** [https://mehrn0ush.github.io/tmbom-studio/](https://mehrn0ush.github.io/tmbom-studio/)  
**Deep-link sample:** [/?example=checkout-api](https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api)

This post is the **“open the site and get value in one sitting”** guide. For org rollout, ownership, and SDLC gates, see [`GUIDELINES.md`](../../GUIDELINES.md).

---

## Why use the GitHub Pages build?

ThreatModeler is a **static TM-BOM studio**. The Pages deploy is the same React app you’d build locally — no account, no backend, no multi-tenant server. That is intentional.

| Why Pages | What it means in practice |
| --- | --- |
| **Zero install for workshops** | Project the live URL; facilitators and guests share one browser tab. |
| **Shareable demos** | Send `?example=checkout-api` so reviewers land on a full model, not a blank canvas. |
| **Standards-shaped output** | The goal is a CycloneDX 2.0 `.cdx.json` you can commit — not a proprietary SaaS export. |
| **Low trust boundary** | Everything runs client-side. Drafts stay in *that* browser; the durable artifact is the file you save. |
| **Fast iteration loop** | Push to `main` → Pages rebuilds. Schema/UI experiments ship without standing up infra. |

### When Pages is the right tool

- Facilitated design reviews and “try the sample” onboarding  
- Evaluating whether TM-BOM fits your review process  
- Teaching STRIDE / CAPEC / risk statements against a known checkout-API model  
- Quick edits when you already have a `.cdx.json` on disk and just need the UI  

### When to prefer a local or internal host instead

- Models that contain **sensitive architecture** (prefer private Git + internal static host)  
- Offline workshops or air-gapped environments (`npm run build` / `npm run preview`)  
- Org SSO or network policy that blocks `github.io`  
- You want pinned builds behind your own CDN (still just static `dist/`)  

**Rule of thumb:** use Pages to *author and teach*; use Git (or your BOM registry) to *own and audit*.

---

## How to use it (first 15 minutes)

### 1. Open with a sample, not a blank page

Start here:

[https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api](https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api)

You get zones, assets, STRIDE/LINDDUN threats, CAPEC, scenarios, risks, controls, and an out-of-scope example. Click around the grouped nav (Model → Threat analysis → Risk & controls → Output). Collapse **Catalogs** / **Workshop & advanced** until you need them.

### 2. Treat browser storage as a scratch pad

The app caches drafts in `localStorage`. That is **not** the system of record.

1. Open **Projects** (sidebar or top bar).  
2. **Save project file…** → store `*.cdx.json` under your product repo (see [`projects/README.md`](../../projects/README.md)).  
3. Later: **Open project file…** (or drag a JSON onto Projects).  

If you only use Pages and never save, you will lose work when the cache is cleared.

### 3. Walk the modeling path (happy path)

| Step | View | Do this |
| --- | --- | --- |
| Name | Overview | Set the system name (maps to BOM metadata). |
| Architecture | Blueprint | Zones → assets → flows; optional actors; link `componentRef` after SBOM import. |
| Scope | Scope & assumptions | Capture boundary and assumptions early. |
| Threats | Threats | Suggest STRIDE/LINDDUN on an asset; set in-scope; weaknesses / kill chain when useful. |
| Patterns | CAPEC | Add from OWASP view or the hierarchy browser (1000/3000-style ChildOf). |
| Scenarios | Scenarios | Intent, motivation, attack vector, linked threats. |
| Risks | Risks | Statement, ratings, owner, responses → controls. |
| Evidence | Report / Projects | Markdown or print for stakeholders; `.cdx.json` for Git. |

Use **cross-links** on a threat to jump to affected assets, CAPEC, trees, risks, and controls — the model is reference-heavy; the UI should feel connected, not like separate lists.

### 4. Import instead of redrawing (when you already have artifacts)

On **Projects**:

- **Import SBOM…** — map CycloneDX components/services into blueprint assets with `componentRef` / bom-ref links.  
- **Import Threat Dragon / draw.io…** — lossy DFD → assets and flows (a starter canvas, not a perfect round-trip).  
- **Run JSON Schema check** / save with validation — structural checks always run; AJV validates against the bundled 2.0 schema (the checkout sample is kept green in CI).

### 5. Filter library-style noise with `cyclonedx:in-scope`

There is **no** normative in-scope field in the spec (on purpose). Mark threats with property `cyclonedx:in-scope=false` (UI toggle on Threats; also reads `asf:in-scope`).

Then:

- **Report** — hide out-of-scope rows; Markdown separates them.  
- **Projects → Export scope** — export all, in-scope only, or keep all for consumers that flag scope themselves.

Use this for shared libraries / platform threat catalogs where not every threat applies to every product.

### 6. End the session with two artifacts

1. **`.cdx.json`** — committed, reviewed, tagged with the release.  
2. **Report Markdown or PDF** — for people who will never open the studio.

Optional: **Session** package for workshop attendees; **Links** for SBOM/VEX/BOM-Link URNs beside the TM-BOM.

---

## How / why this fits CycloneDX practice

| Artifact | Question it answers |
| --- | --- |
| **SBOM** | What did we ship? |
| **VEX / VDR** | Which known vulns matter right now? |
| **TM-BOM** | What can go wrong *by design*, and how do we respond? |

Pages gives you a **human-friendly authoring surface** for the third artifact without inventing a proprietary format. Schemas track [`2.0-dev-threatmodeling`](https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling) — pin, re-validate, expect churn.

---

## Security notes for a public Pages URL

- Do **not** paste production internal diagrams into a shared workshop laptop without classification review.  
- Prefer **scoped** models when sharing with vendors.  
- Pages CSP is enforced via a **meta** policy on the built HTML (GitHub Pages does not give this project custom HTTP headers).  
- Anyone with the URL can load the *app*; they only see *your* model if you load it in that browser or share the JSON file.

---

## Cheat sheet

| Goal | Action |
| --- | --- |
| Try the product | Open [/?example=checkout-api](https://mehrn0ush.github.io/tmbom-studio/?example=checkout-api) |
| Blank model | Sidebar → **New model** |
| Keep work | **Projects → Save project file…** → commit |
| Stakeholder pack | **Report → Download .md** or Print/PDF |
| Org process | [`GUIDELINES.md`](../../GUIDELINES.md) |
| Run offline | Clone repo → `npm run dev` or `npm run build && npm run preview` |

---

*tmbom-studio is Apache-2.0. Spec ownership stays with CycloneDX; this app is a product-layer studio on top of the evolving 2.0 threat-modeling schemas.*
