import re

# Valid IPv4 — each octet 0-255, word-bounded to avoid partial matches inside longer strings
IPV4_RE = re.compile(
    r'\b'
    r'(?:(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)\.){3}'
    r'(?:25[0-5]|2[0-4]\d|1\d{2}|[1-9]\d|\d)'
    r'\b'
)

# MAC colon format: aa:bb:cc:dd:ee:ff  (Linux / standard)
MAC_COLON_RE = re.compile(r'\b[0-9A-Fa-f]{2}(?::[0-9A-Fa-f]{2}){5}\b')

# MAC hyphen format: aa-bb-cc-dd-ee-ff  (Windows ipconfig)
MAC_HYPHEN_RE = re.compile(r'\b[0-9A-Fa-f]{2}(?:-[0-9A-Fa-f]{2}){5}\b')

# MAC Cisco dot format: aabb.ccdd.eeff  (show mac-address-table output)
MAC_DOT_RE = re.compile(r'\b[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\.[0-9A-Fa-f]{4}\b')

# Multi-segment ALL-CAPS hostname — requires 3+ segments (2+ hyphens) so single keywords
# like DYNAMIC/ARPA and two-part VLAN names like CCTV-CAMERAS do NOT match
HOSTNAME_RE = re.compile(r'\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+){2,}\b')

# Location strings — applied before hostnames so substituted values never re-match HOSTNAME_RE
BUILDING_RE  = re.compile(r'\bBuilding\s+[A-Z0-9][A-Z0-9\-]*\b')
FLOOR_RE     = re.compile(r'\bFloor\s+\d+\b')
ROOM_RE      = re.compile(r'\bRoom\s+[A-Z0-9][A-Z0-9\-]*\b')
RACK_RE      = re.compile(r'\bRack\s+[A-Z0-9][A-Z0-9\-]*\b')
CORRIDOR_RE  = re.compile(r'\bCorridor\s+[A-Z0-9][A-Z0-9\-]*\b')
STAIRWELL_RE = re.compile(r'\bStairwell\s+[A-Z0-9][A-Z0-9\-]*\b')
