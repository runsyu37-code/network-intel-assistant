# Network Intelligence Assistant

A local, privacy-first toolchain for network operations — built to help network engineers collect, sanitize, and analyze infrastructure data without sending sensitive information to cloud services.

## Why this exists

Network engineers routinely collect device inventory from switches, NVRs, and cameras — but the raw output (real IPs, MACs, hostnames, rack locations) is too sensitive to paste into cloud AI tools. This project solves that with a **local sanitizer** that replaces every sensitive value with consistent fake placeholders before any AI ever sees the data.

## Project structure

```
network-intel-assistant/
├── sanitizer/          # Core sanitizer engine (Python, no dependencies)
│   ├── sanitize.py     # Main CLI script
│   ├── patterns.py     # Regex patterns — easy to extend
│   └── mappings.json   # Hostname mapping table
├── samples/            # Synthetic (fake) switch/ARP/config samples
├── tests/              # Unit tests (Python unittest)
└── output/             # Sanitized output files (git-ignored)
```

## Quick start

```bash
# No install needed — pure Python 3.11+ standard library
python sanitizer/sanitize.py samples/fake_input_01.txt output/clean_01.txt
python sanitizer/sanitize.py samples/fake_input_01.txt output/clean_01.txt --report output/report_01.json
```

## Data confidentiality model

```
Phase A (this repo)  →  Build & test using FAKE data only
Phase B (work machine, offline)  →  Run sanitizer on REAL data → sanitized_output.txt
Phase C (anywhere)  →  Paste sanitized output into any AI tool safely
```

Real data never enters this repository. All samples are synthetically generated.

## Status

- [x] Phase A — `data-sanitizer-agent` (this repo)
- [ ] Phase B — `network-inventory-agent`
- [ ] Phase C — `topology-mapper-agent`
- [ ] Phase D — `alert-triage-agent`

---

*Built as part of a network engineering internship project. See `ROADMAP.md` for the full plan.*
