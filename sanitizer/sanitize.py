#!/usr/bin/env python3
"""
sanitize.py — replace sensitive network values with safe placeholders.

Usage:
    python sanitize.py <input> <output>
    python sanitize.py <input> <output> --report report.json
    python sanitize.py <input> <output> --persist-mapping
"""

import argparse
import itertools
import json
import re
import sys
from pathlib import Path

from patterns import (
    BUILDING_RE, CORRIDOR_RE, FLOOR_RE, HOSTNAME_RE,
    IPV4_RE, MAC_COLON_RE, MAC_DOT_RE, MAC_HYPHEN_RE,
    RACK_RE, ROOM_RE, STAIRWELL_RE,
)

_SCRIPT_DIR = Path(__file__).resolve().parent
_GITIGNORE_PATH = _SCRIPT_DIR.parent / ".gitignore"


class Sanitizer:
    def __init__(self) -> None:
        self._ip_map:       dict[str, str] = {}
        self._mac_map:      dict[str, str] = {}  # keyed by normalized hex (no separators)
        self._host_map:     dict[str, str] = {}
        self._location_map: dict[str, str] = {}

        self._ip_seq  = itertools.count(1)
        self._mac_seq = itertools.count(1)

        self._host_sw_seq    = itertools.count(1)
        self._host_nvr_seq   = itertools.count(1)
        self._host_cam_seq   = itertools.count(1)
        self._host_other_seq = itertools.count(1)

        self._building_seq  = iter("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
        self._floor_seq     = itertools.count(1)
        self._room_seq      = itertools.count(1)
        self._rack_seq      = itertools.count(1)
        self._corridor_seq  = itertools.count(1)
        self._stairwell_seq = itertools.count(1)

    # ── Persistence ───────────────────────────────────────────────────────

    def load(self, saved: dict) -> None:
        """Restore mappings from a previous run so fake values stay consistent."""
        self._ip_map       = dict(saved.get("ip_mappings", {}))
        self._mac_map      = dict(saved.get("mac_mappings", {}))
        self._host_map     = dict(saved.get("hostname_mappings", {}))
        self._location_map = dict(saved.get("location_mappings", {}))
        # Advance counters past already-used positions to avoid collisions
        self._ip_seq  = itertools.count(len(self._ip_map) + 1)
        self._mac_seq = itertools.count(len(self._mac_map) + 1)

    # ── IP ────────────────────────────────────────────────────────────────

    def _fake_ip(self, real: str) -> str:
        if real not in self._ip_map:
            self._ip_map[real] = f"10.0.0.{next(self._ip_seq)}"
        return self._ip_map[real]

    # ── MAC ───────────────────────────────────────────────────────────────

    @staticmethod
    def _norm_mac(mac: str) -> str:
        return re.sub(r"[:\-\.]", "", mac).lower()

    def _fake_mac(self, real: str, fmt: str) -> str:
        norm = self._norm_mac(real)
        if norm not in self._mac_map:
            n = next(self._mac_seq)
            # "fafe" prefix = locally-administered OUI — signals "this is a generated MAC"
            self._mac_map[norm] = f"fafe{n:08x}"
        h = self._mac_map[norm]  # 12 lowercase hex chars
        if fmt == "colon":
            return ":".join(h[i:i+2] for i in range(0, 12, 2))
        if fmt == "hyphen":
            return "-".join(h[i:i+2] for i in range(0, 12, 2))
        return ".".join(h[i:i+4] for i in range(0, 12, 4))  # Cisco dot

    # ── Hostname ──────────────────────────────────────────────────────────

    def _fake_host(self, real: str) -> str:
        if real not in self._host_map:
            up = real.upper()
            if "SW" in up or "SWITCH" in up:
                fake = f"SW-{next(self._host_sw_seq):03d}"
            elif "NVR" in up:
                fake = f"NVR-{next(self._host_nvr_seq):03d}"
            elif "CAM" in up:
                fake = f"CAM-{next(self._host_cam_seq):03d}"
            else:
                fake = f"HOST-{next(self._host_other_seq):03d}"
            self._host_map[real] = fake
        return self._host_map[real]

    # ── Locations ─────────────────────────────────────────────────────────

    def _fake_loc(self, real: str, kind: str) -> str:
        if real not in self._location_map:
            if kind == "building":
                self._location_map[real] = f"Building-{next(self._building_seq)}"
            elif kind == "floor":
                self._location_map[real] = f"Floor-{next(self._floor_seq)}"
            elif kind == "room":
                self._location_map[real] = f"Room-{next(self._room_seq):03d}"
            elif kind == "rack":
                self._location_map[real] = f"Rack-{next(self._rack_seq):02d}"
            elif kind == "corridor":
                self._location_map[real] = f"Corridor-{next(self._corridor_seq):02d}"
            else:
                self._location_map[real] = f"Stairwell-{next(self._stairwell_seq):02d}"
        return self._location_map[real]

    # ── Main sanitize pass ────────────────────────────────────────────────

    def sanitize(self, text: str) -> str:
        # 1. Locations first — longer patterns, and their fake values won't re-match HOSTNAME_RE
        for pat, kind in (
            (BUILDING_RE,  "building"),
            (FLOOR_RE,     "floor"),
            (ROOM_RE,      "room"),
            (RACK_RE,      "rack"),
            (CORRIDOR_RE,  "corridor"),
            (STAIRWELL_RE, "stairwell"),
        ):
            text = pat.sub(lambda m, k=kind: self._fake_loc(m.group(), k), text)

        # 2. Hostnames before MACs/IPs — hostnames never contain MAC or IP literals
        text = HOSTNAME_RE.sub(lambda m: self._fake_host(m.group()), text)

        # 3. MACs before IPs — Cisco dot-MAC uses dots but never matches a valid IP pattern
        text = MAC_COLON_RE.sub(lambda m: self._fake_mac(m.group(), "colon"), text)
        text = MAC_HYPHEN_RE.sub(lambda m: self._fake_mac(m.group(), "hyphen"), text)
        text = MAC_DOT_RE.sub(lambda m: self._fake_mac(m.group(), "dot"), text)

        # 4. IPs last — shortest and most general pattern, applied after everything else
        text = IPV4_RE.sub(lambda m: self._fake_ip(m.group()), text)

        return text

    # ── Report & counts ───────────────────────────────────────────────────

    def report(self) -> dict:
        return {
            "ip_mappings":       self._ip_map,
            "mac_mappings":      self._mac_map,
            "hostname_mappings": self._host_map,
            "location_mappings": self._location_map,
        }

    def counts(self) -> tuple[int, int, int]:
        return len(self._ip_map), len(self._mac_map), len(self._host_map)


# ── .gitignore helper ─────────────────────────────────────────────────────

def _ensure_gitignored(report_path: Path) -> None:
    """Append report filename to .gitignore if no existing rule covers it."""
    if not _GITIGNORE_PATH.exists():
        return
    content = _GITIGNORE_PATH.read_text(encoding="utf-8")
    name = report_path.name
    if name not in content and str(report_path) not in content:
        with open(_GITIGNORE_PATH, "a", encoding="utf-8") as f:
            f.write(f"{name}\n")


# ── CLI ───────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Replace IPs, MACs, hostnames, and location strings with safe placeholders."
    )
    parser.add_argument("input_file",  help="Path to input file")
    parser.add_argument("output_file", help="Path to sanitized output file")
    parser.add_argument("--report", metavar="FILE",
                        help="Write JSON audit report of every real→fake replacement")
    parser.add_argument("--persist-mapping", action="store_true",
                        help="Load/save mappings from sanitizer/mappings.json for cross-run consistency")
    args = parser.parse_args()

    inp = Path(args.input_file)
    out = Path(args.output_file)

    if not inp.exists():
        print(f"Error: input file '{inp}' not found.", file=sys.stderr)
        sys.exit(1)

    s = Sanitizer()

    mappings_path = _SCRIPT_DIR / "mappings.json"
    if args.persist_mapping and mappings_path.exists():
        with open(mappings_path, encoding="utf-8") as f:
            saved = json.load(f)
        if saved:
            s.load(saved)

    text = inp.read_text(encoding="utf-8", errors="replace")
    clean = s.sanitize(text)

    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(clean, encoding="utf-8")

    ip_n, mac_n, host_n = s.counts()
    print(f"Sanitized {ip_n} IPs, {mac_n} MACs, {host_n} hostnames -> {out}")

    if args.report:
        rp = Path(args.report)
        rp.parent.mkdir(parents=True, exist_ok=True)
        with open(rp, "w", encoding="utf-8") as f:
            json.dump(s.report(), f, indent=2, ensure_ascii=False)
        print(f"Mapping report written -> {rp}")
        _ensure_gitignored(rp)

    if args.persist_mapping:
        with open(mappings_path, "w", encoding="utf-8") as f:
            json.dump(s.report(), f, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
