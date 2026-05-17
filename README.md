# Network Intelligence Assistant

**A privacy-first toolchain for network operations** — sanitize, parse, and analyze
infrastructure data without sending sensitive information to cloud AI services.

---

## Problem

Network engineers collect device inventory daily: switch MAC tables, ARP entries, and
port descriptions that link cameras to rack locations across buildings and floors. This
data is operationally critical but too sensitive to process with cloud AI — real IPs,
MAC addresses, and hostnames reveal physical topology and security boundaries.

This project solves that constraint with a **local-only sanitizer** that replaces every
sensitive value with a consistent, traceable placeholder *before* any AI ever sees the
data. Once sanitized, the output flows safely to any cloud tool or public repository.

---

## Architecture: Three Phases

```
┌─────────────────────────────────────────────────────────────────────┐
│ Phase A — Build  (personal machine, fake data only)                 │
│                                                                     │
│   Claude Code + synthetic samples  →  sanitize.py  (regex-based)   │
│   Real data never touches the AI.                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │  copy script to work machine
┌────────────────────────────▼────────────────────────────────────────┐
│ Phase B — Run  (work machine, fully offline)                        │
│                                                                     │
│   real_config.txt  ──►  python sanitize.py  ──►  clean_config.txt  │
│   No internet. No AI. No cloud call. Plain Python only.             │
└────────────────────────────┬────────────────────────────────────────┘
                             │  sanitized file is now safe to share
┌────────────────────────────▼────────────────────────────────────────┐
│ Phase C — Use  (anywhere)                                           │
│                                                                     │
│   Paste clean_config.txt into Claude / ChatGPT / Gemini, or        │
│   push it to a public GitHub repo as a documented sample.           │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What It Sanitizes

| Sensitive value | Input example | Output placeholder |
|---|---|---|
| IPv4 address | `203.0.113.10` | `10.0.0.1` |
| MAC — colon format | `aa:bb:cc:dd:ee:ff` | `fa:fe:00:00:00:01` |
| MAC — hyphen format | `aa-bb-cc-dd-ee-ff` | `fa-fe-00-00-00-01` |
| MAC — Cisco dot format | `0011.22ab.cd01` | `fafe.0000.0001` |
| Hostname | `PROD-SW-FLOOR3-01` | `SW-001` |
| Building | `Building EX-A` | `Building-A` |
| Floor | `Floor 3` | `Floor-1` |
| Room | `Room R-301` | `Room-001` |
| Rack | `Rack RK-12` | `Rack-01` |

Replacement is **consistent within a run**: the same real value always maps to the same
placeholder, so topology relationships survive in the sanitized output.

---

## Quick Start

No installation required. Requires **Python 3.11+** and the standard library only.

```bash
# 1. Clone the repo
git clone https://github.com/runsyu37-code/network-intel-assistant.git
cd network-intel-assistant

# 2. Sanitize a file
python sanitizer/sanitize.py samples/fake_input_01.txt output/clean_01.txt

# 3. Sanitize with a full mapping audit report
python sanitizer/sanitize.py samples/fake_input_02.txt output/clean_02.txt \
    --report output/report_02.json

# 4. Keep mappings stable across multiple files (same real IP → same fake IP every run)
python sanitizer/sanitize.py samples/fake_input_03.txt output/clean_03.txt \
    --persist-mapping
```

**Expected output:**
```
Sanitized 18 IPs, 18 MACs, 1 hostnames -> output/clean_02.txt
Mapping report written -> output/report_02.json
```

**Run tests:**
```bash
python -m unittest discover tests -v
# 24 tests, OK
```

---

## Sample: Before and After

**Input** — `samples/fake_input_03.txt` (excerpt):
```
EXAMPLE-SW-FLOOR3-01#show running-config
!
hostname EXAMPLE-SW-FLOOR3-01
!
interface GigabitEthernet1/0/1
 description [Building EX-A][Floor 3][Room R-301] EXAMPLE-CAM-R301-01
 switchport access vlan 10
 spanning-tree portfast
!
interface GigabitEthernet1/0/47
 description [Building EX-A][Floor 3][Rack RK-12] UPLINK-TO-EXAMPLE-SW-FLOOR2-01
 switchport mode trunk
```

**Output** — `output/clean_03.txt` (same lines):
```
SW-001#show running-config
!
hostname SW-001
!
interface GigabitEthernet1/0/1
 description [Building-A][Floor-1][Room-001] CAM-001
 switchport access vlan 10
 spanning-tree portfast
!
interface GigabitEthernet1/0/47
 description [Building-A][Floor-1][Rack-01] SW-002
 switchport mode trunk
```

Interface numbers, VLAN IDs, and switch commands are preserved intact.
Only the sensitive identifying values are replaced.

---

## Project Structure

```
network-intel-assistant/
├── sanitizer/
│   ├── sanitize.py      # CLI entry point — Sanitizer class + argparse
│   ├── patterns.py      # All regex patterns, separated for easy extension
│   └── mappings.json    # Persistent hostname mapping (used with --persist-mapping)
├── samples/             # Synthetic (fake) switch/ARP/config samples — safe to share
├── tests/
│   └── test_sanitize.py # 24 unit tests covering IPv4, MAC x3, consistency, no-leakage
└── output/              # Sanitized output (git-ignored — stays local)
```

---

## Limitations

- **Regex-based only.** The sanitizer uses pattern matching, not semantic understanding.
  Values in unusual formats (decimal-encoded IPs, base64 strings) will not be detected.
- **Subnet masks get replaced.** `255.255.255.0` is a valid IPv4 pattern and is
  substituted with a placeholder. The output remains safe; the mask is just cosmetically
  absent.
- **Plain text only.** PDF reports, Excel spreadsheets, and Visio diagrams require
  pre-conversion to text before sanitization.
- **English location keywords.** Patterns for `Building`, `Floor`, `Room`, and `Rack`
  are hardcoded in English. Sites using other languages need updates in `patterns.py`.
- **Not a DLP product.** This tool is a workflow aid for a specific, well-understood
  format (Cisco / Linux CLI text output). It is not a substitute for a formal
  Data Loss Prevention system.

---

## Roadmap

| Phase | Agent | Status |
|---|---|---|
| A | **`data-sanitizer-agent`** — this repo | ✅ Complete |
| B | `network-inventory-agent` — MAC/ARP tables → structured JSON/CSV | Planned |
| C | `topology-mapper-agent` — inventory JSON → Mermaid network diagram | Planned |
| D | `alert-triage-agent` — CCTV failure + topology → likely-cause runbook | Planned |

---

## Background

Built during a network engineering internship (May–October 2026) to unblock a real
data-collection bottleneck: mapping which CCTV camera connects to which switch port,
NVR, building, and rack — manually, across dozens of devices. The sanitizer is the
foundation layer that lets every downstream AI tool operate on safe, de-identified data.

---

*Python 3.11+ · Standard library only · No external dependencies*
