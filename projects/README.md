# Project TM-BOMs (Git-friendly persistence)

Store durable threat models here (or in your product repo) as CycloneDX `.cdx.json` files.

## Convention

```text
projects/<system-name>.cdx.json
```

Examples:

- `projects/checkout-api.cdx.json`
- `projects/payments-ledger.cdx.json`

## Workflow

1. In **tmbom-studio**, open **Projects / Export**.
2. Click **Save project file…** and save into this folder (or your product `security/threat-models/` path).
3. Commit the JSON in Git — that file is the system of record.
4. Later, **Open project file…** to resume editing.

Browser `localStorage` is only a draft cache. Prefer files under `projects/` (or your org path) for anything you need to keep, review, or share.

A committed sample lives at [`examples/checkout-api.cdx.json`](../examples/checkout-api.cdx.json).
