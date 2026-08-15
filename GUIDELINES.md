# Organizational Usage Guide

How security, engineering, and risk teams can adopt **ThreatModeler** to produce and share CycloneDX 2.0 Threat Model BOMs (TM-BOMs) across an organization.

ThreatModeler is a workspace for creating standards-based threat models—not a replacement for your GRC platform. Treat exported `.cdx.json` files as the durable artifact you version, review, and exchange.

For a short **how/why to use the public GitHub Pages app** (workshops, demos, save-vs-cache), see [docs/blog/using-tmbom-studio-on-github-pages.md](./docs/blog/using-tmbom-studio-on-github-pages.md).

---

## 1. Who should use it

| Role | Typical use |
| --- | --- |
| **Application / product security** | Facilitate modeling sessions; own the TM-BOM quality bar |
| **Software architects & tech leads** | Build and maintain architecture blueprints (assets, zones, flows) |
| **Developers** | Contribute mitigations; keep models in sync with design changes |
| **Risk / compliance** | Consume risk ratings and responses for registers and audits |
| **Vendors / partners** | Exchange TM-BOMs as part of due diligence (with SBOMs) |

Start with one product security champion per team. Expand once a repeatable export and review path exists.

---

## 2. Recommended operating model

### Place in the SDLC

Use ThreatModeler at these checkpoints:

1. **Design / architecture review** — first blueprint and initial STRIDE pass  
2. **Before major releases** — refresh scenarios and residual risk  
3. **Material change** — new trust boundary, data store, external integration, or auth model  
4. **Vendor onboarding** — request or produce a TM-BOM alongside SBOM/VEX where applicable  

### Cadence

| Activity | Suggested frequency |
| --- | --- |
| Blueprint accuracy check | Every sprint or when architecture changes |
| Full STRIDE / scenario review | Per release or quarterly |
| Risk register sync | After each modeling session |
| Archive of approved TM-BOM | On release tag / change-request approval |

### Ownership

- **Author**: team that builds the system (architect or tech lead)  
- **Reviewer**: AppSec or peer security engineer  
- **Approver**: risk owner for high/critical residual risks  
- **Custodian**: store approved `.cdx.json` in the product’s source repo or artifact registry  

---

## 3. End-to-end workflow

### Step A — Stand up the workspace

```bash
npm install
npm run build   # for static hosting
# or
npm run dev     # for local / workshop use
```

Options for organizations:

- **Local workshops** — facilitators run `npm run dev` on a laptop during design sessions  
- **Internal static host** — deploy `dist/` behind SSO (Nginx, CloudFront, internal PaaS)  
- **Per-engineer clone** — each person models locally; shared truth is the exported JSON in Git  

> Models are stored in the browser (local persistence) as a **draft only**. **Do not rely on browser storage as the system of record.** Use **Projects → Save project file…** and commit under `projects/<system>.cdx.json` (see [`projects/README.md`](./projects/README.md)) or your product repo’s threat-model path.

### Step B — Create the blueprint

1. Name the system on **Overview** (maps to BOM metadata component name).  
2. Open **Blueprint** and add **zones** (e.g. Internet, DMZ, Private VPC).  
3. Add **assets** (services, data stores, gateways, actors) and assign zones.  
4. Draw **flows** between assets (drag handle → handle); mark encryption and protocols.  
5. Add **trust boundaries** between zones that matter for control placement.  

Keep the diagram at the level of security-relevant components—not every microservice detail.

### Step C — Catalog threats

1. Use **Suggest STRIDE** / **Suggest LINDDUN** on critical assets, then edit for accuracy.  
2. Or add threats manually under **Threats** (toggle STRIDE vs LINDDUN).  
3. Optionally model attacker goals under **Attack trees** and link them to threats.  
4. Link each threat to **affected assets** via `bom-ref`.  

Prefer methodology-consistent naming so reports and dashboards stay comparable across teams.

### Step C2 — Session & supply-chain links

1. Under **Session**, record workshop date, participants, and notes; export a `.session.json` package to share.  
2. Under **Links**, attach BOM-Link URNs / SBOM / VEX references as CycloneDX `externalReferences`.  

### Step D — Describe scenarios

Under **Scenarios**, document *how* a threat is realized:

- Intent and access level  
- Likelihood and impact  
- Linked threats and affected assets  

Scenarios are what risk committees usually discuss—not raw STRIDE labels alone.

### Step E — Record risks and responses

Under **Risks**:

1. Write a clear statement: *If … then … resulting in …*  
2. Set **inherent** likelihood/impact.  
3. Attach **responses** (`reduce`, `avoid`, `transfer`, `accept`, etc.).  
4. Link related threats / scenarios.  
5. Optionally capture residual risk after planned controls.  

High/critical residual risks should map to tickets, exceptions, or insurance decisions outside this tool.

### Step F — Export and govern the artifact

1. **Export** → download `.cdx.json`.  
2. Commit to the product repository, for example:

   ```text
   security/threat-models/<system-name>.cdx.json
   ```

3. Open a PR; AppSec reviews blueprint fidelity and residual risk.  
4. Tag or attach the file to the release / change record.  
5. Re-import the file later to continue editing (Import on the Export page).  

---

## 4. Integrating with organizational processes

### With Secure SDLC / change management

- Require an **updated TM-BOM** (or a documented “no architecture change” attestation) for releases that cross a defined risk threshold.  
- Reference the TM-BOM path in architecture decision records (ADRs) and security questionnaires.  

### With risk and compliance

- Import risk statements and ratings into the enterprise risk register (manual or scripted).  
- Use CycloneDX fields (`domains`, `responses`, `inherentRisk` / `residualRisk`) as the exchange format so tools stay interoperable as TM-BOM tooling matures.  
- For audits, provide the approved `.cdx.json` plus the review PR / meeting notes.  

### With CycloneDX supply-chain practice

| Artifact | Role |
| --- | --- |
| **SBOM** | What you ship (components) |
| **VDR / VEX** | Known vulnerabilities and exploitability |
| **TM-BOM** (this tool) | What can go wrong by design, and how you respond |

Store them side by side under `security/` or your BOM registry. Use the same system name and version conventions where possible.

### With ticketing

For each risk response of strategy `reduce` or `avoid`:

- Create an engineering ticket  
- Put the threat/risk `bom-ref` in the ticket  
- Update residual risk when the control ships  

---

## 5. Workshop pattern (90 minutes)

| Time | Activity |
| --- | --- |
| 0–10 min | Scope, assumptions, out-of-scope |
| 10–35 min | Build / update blueprint together |
| 35–60 min | STRIDE on assets crossing trust boundaries |
| 60–80 min | Top scenarios + risk statements |
| 80–90 min | Owners, responses, export, next actions |

Load the **Sample Checkout API** model first when onboarding new facilitators so the UI is familiar before a live system session.

---

## 6. Quality bar for “done”

A TM-BOM is ready for review when:

- [ ] System name, version, and timestamp are set in metadata  
- [ ] Blueprint has zones, assets, and the main data/control flows  
- [ ] Trust boundaries match real network / identity / data boundaries  
- [ ] Threats use a declared methodology (e.g. STRIDE) and link to assets  
- [ ] Material threats have at least one scenario  
- [ ] Top risks have statements, ratings, and response strategies  
- [ ] File is exported, stored in Git (or registry), and reviewed  

---

## 7. Security and data-handling notes

- Threat models often contain **sensitive architecture detail**. Host the app and store TM-BOMs according to your information-classification policy.  
- Prefer internal Git / artifact storage over public repos for production systems.  
- Browser local storage is convenient for drafts only.  
- When sharing with vendors, export a **scoped** model (minimize internal zone detail) if full architecture disclosure is not required.  

---

## 8. Rollout plan (suggested)

1. **Pilot** — one product team + AppSec; produce one approved TM-BOM.  
2. **Template** — agree naming, folder layout, and STRIDE depth expectations.  
3. **Gate** — add “TM-BOM attached or waived” to the release checklist.  
4. **Scale** — train facilitators; optional internal hosting of the built UI.  
5. **Automate later** — validate JSON against vendored schemas in CI; sync risks to GRC via API when ready.  

Schema copies for validation live under `schemas/2.0/` (see [README](./README.md)).

---

## 9. Limits to set expectations

- CycloneDX 2.0 threat-modeling schemas are evolving (`2.0-dev-threatmodeling`); pin schema versions and revisit exports when you upgrade.  
- The UI covers the core blueprint / threat / scenario / risk path—not every CycloneDX construct (attack trees, full LINDDUN, etc.). Extend the model in JSON or future UI work as needed.  
- Risk scores here are a **qualitative matrix** aid; align scales with your enterprise risk methodology before using them for formal capital or regulatory reporting.  

---

## 10. Quick reference

| Goal | Action in ThreatModeler |
| --- | --- |
| Start from an example | Overview → **Load sample Checkout API** |
| Model architecture | **Blueprint** |
| Enumerate abuse | **Threats** (+ suggest on asset) |
| Describe attacks | **Scenarios** |
| Track treatment | **Risks** |
| Share / archive | **Export** → `.cdx.json` |
| Resume work | **Export** → Import JSON |

For schema definitions and field semantics, see the [CycloneDX 2.0 threat-modeling schemas](https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling/schema/2.0).
