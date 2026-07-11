import { readFileSync } from "node:fs";
import { join } from "node:path";
import { globSync } from "glob";

const interactiveRe = /<(button|a|Link|NavLink|input)\b/;
const targetRe = /(minHeight|minWidth)\s*:\s*(?:'|"|`)?([4-9]\d)/g;
const varRe = /var\(--touch-min\)/;

function auditFile(filePath) {
  const content = readFileSync(filePath, "utf8");
  const lines = content.split(/\r?\n/);
  const issues = [];

  for (let index = 0; index < lines.length; index += 1) {
    if (!interactiveRe.test(lines[index])) continue;

    const window = lines.slice(index, index + 20).join("\n");
    const sizes = [...window.matchAll(targetRe)].map((match) => Number(match[2]));
    const hasTarget = sizes.some((size) => size >= 48) || varRe.test(window);

    if (!hasTarget) {
      issues.push(`${filePath}:${index + 1} interactive element without visible 48px target hint`);
    }
  }

  return issues;
}

const target = process.argv[2] ?? "apps/mobile";
const sourceRoot = globSync(join(target, "src", "**", "*.tsx"), { windowsPathsNoEscape: true });
const issues = sourceRoot.flatMap(auditFile);

if (issues.length > 0) {
  console.log("FAIL");
  for (const issue of issues) {
    console.log(issue);
  }
  process.exit(1);
}

console.log(`PASS: audited ${sourceRoot.length} TSX files under ${target}`);
