from __future__ import annotations

import re
import sys
from pathlib import Path

INTERACTIVE_RE = re.compile(r"<(button|a|Link|NavLink|input)\b")
TARGET_RE = re.compile(r"(minHeight|minWidth)\s*:\s*(?:'|\"|`)?([4-9]\d)")
VAR_RE = re.compile(r"var\(--touch-min\)")


def audit_file(path: Path) -> list[str]:
    lines = path.read_text(encoding="utf-8").splitlines()
    issues: list[str] = []

    for idx, line in enumerate(lines):
        if not INTERACTIVE_RE.search(line):
            continue

        window = "\n".join(lines[idx : idx + 20])
        sizes = [int(match.group(2)) for match in TARGET_RE.finditer(window)]
        has_target = any(size >= 48 for size in sizes) or bool(VAR_RE.search(window))

        if not has_target:
            issues.append(f"{path}:{idx + 1} interactive element without visible 48px target hint")

    return issues


def main() -> int:
    target = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("apps/mobile")
    source_root = target / "src" if (target / "src").exists() else target

    if not source_root.exists():
        print(f"ERROR: path not found: {source_root}")
        return 2

    files = sorted(source_root.rglob("*.tsx"))
    issues: list[str] = []

    for file_path in files:
        issues.extend(audit_file(file_path))

    if issues:
        print("FAIL")
        for issue in issues:
          print(issue)
        return 1

    print(f"PASS: audited {len(files)} TSX files under {source_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
