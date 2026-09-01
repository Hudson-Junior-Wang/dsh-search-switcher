/**
 * Smoke test for the dsh-search-switcher bundle.
 *
 * Verifies the shape the DeepSeek Harness plugin loader and the
 * dsh-plugin catalog gate rely on:
 *   - package.json declares an installable dsh.bundle manifest
 *   - the referenced patch file exists and loads the bundle's own id/name
 *   - the client bundle exposes `apply` + `inject`
 *   - both lib files pass `node --check`
 *
 * Run with: npm test
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));

check(
  pkg.dsh?.bundle?.patch,
  "package.json must declare dsh.bundle.patch (installable via `dsh plugin add`)",
);
if (pkg.dsh?.bundle?.patch) {
  const patchPath = join(root, pkg.dsh.bundle.patch);
  check(existsSync(patchPath), `dsh.bundle.patch file missing: ${pkg.dsh.bundle.patch}`);
  if (existsSync(patchPath)) {
    const patch = readFileSync(patchPath, "utf8");
    check(/^- insert:/m.test(patch), "patch file must start with an `- insert:` list");
    check(
      patch.includes(`id: ${pkg.name}`),
      `patch file must load the bundle's own id (${pkg.name})`,
    );
    check(
      patch.includes(`name: ${pkg.name}`),
      `patch file must load the bundle's own name (${pkg.name})`,
    );
  }
}

const client = readFileSync(join(root, "lib/client.js"), "utf8");
check(/exports\.apply\s*=/.test(client), "lib/client.js must export `apply`");
check(/exports\.inject\s*=/.test(client), "lib/client.js must export `inject`");

for (const file of ["lib/client.js", "lib/index.js"]) {
  try {
    execFileSync(process.execPath, ["--check", join(root, file)], {
      stdio: "pipe",
    });
  } catch {
    failures.push(`${file} failed \`node --check\``);
  }
}

if (failures.length > 0) {
  console.error(failures.map((message) => `✗ ${message}`).join("\n"));
  process.exit(1);
}

console.log("✓ smoke test passed — bundle shape is installable and syntactically valid");
