# CAPEC CSV data

Source: [CAPEC List Version 3.9](https://capec.mitre.org/data/downloads.html)  
Download date: 2026-07-23  
MITRE Terms of Use: https://capec.mitre.org/about/termsofuse.html

## Views downloaded

| View ID | Name | Source URL | Unzipped CSV | Data rows |
|--------:|------|------------|--------------|----------:|
| 1000 | Mechanisms of Attack | https://capec.mitre.org/data/csv/1000.csv.zip | `1000/1000.csv` | 559 |
| 3000 | Domains of Attack | https://capec.mitre.org/data/csv/3000.csv.zip | `3000/3000.csv` | 559 |
| 659 | OWASP Related Patterns | https://capec.mitre.org/data/csv/659.csv.zip | `659/659.csv` | 38 |
| 2000 | Comprehensive CAPEC Dictionary | https://capec.mitre.org/data/csv/2000.csv.zip | `2000/2000.csv` | 615 |

Zip archives are gitignored (`data/capec/*.csv.zip`); re-download from the URLs above if needed, then run `npm run generate:capec`.

Note: As published by MITRE for CAPEC 3.9, the CSV contents of Views 1000 and 3000 are identical (same pattern rows); hierarchy differs in the HTML/XML view products.
