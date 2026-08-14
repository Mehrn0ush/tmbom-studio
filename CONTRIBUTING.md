# Contributing to tmbom-studio

Thanks for helping improve ThreatModeler / tmbom-studio.

## Development setup

```bash
git clone https://github.com/Mehrn0ush/tmbom-studio.git
cd tmbom-studio
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Common scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Local app |
| `npm run lint` | Oxlint |
| `npm run test` | Vitest unit tests |
| `npm run build` | Typecheck + production build |
| `npm run build:pages` | Build with `/tmbom-studio/` base path (GitHub Pages) |
| `npm run generate:example` | Regenerate `examples/checkout-api.cdx.json` (+ `public/examples/`) |
| `npm run validate:example` | Structural checks on the sample TM-BOM |
| `npm run ci` | `lint` + `test` + `build` + `validate:example` (what GitHub Actions runs) |

After changing the sample model in `src/lib/sample.ts`, run:

```bash
npm run generate:example
npm run validate:example
```

## Project layout

- `src/` — React UI, Zustand store, CycloneDX helpers
- `examples/` — committed sample `.cdx.json` artifacts
- `projects/` — Git-friendly place for local TM-BOMs (ignored drafts)
- `schemas/2.0/` — vendored CycloneDX 2.0 threat-modeling schemas
- `.github/workflows/` — CI and Pages deploy

## Pull requests

1. Keep changes focused (one concern per PR when practical).
2. Ensure `npm run ci` passes locally.
3. If you touch export shape or the sample, update `examples/checkout-api.cdx.json` via `generate:example`.
4. Do not commit secrets, personal threat models with sensitive architecture, or `node_modules` / `dist`.

## Reporting issues

Use the bug / feature templates under `.github/ISSUE_TEMPLATE/`.

## Code of conduct expectation

Be respectful and constructive. This project sits next to an evolving public spec ([CycloneDX 2.0 threat modeling](https://github.com/CycloneDX/specification/tree/2.0-dev-threatmodeling/schema/2.0)) — prefer clear, schema-aligned changes over speculative one-offs.

## License

Contributions are accepted under the [Apache License 2.0](./LICENSE).
