import fs from "node:fs";
import path from "node:path";

if (process.platform !== "win32") {
  process.exit(0);
}

const pnpmDir = path.join(process.cwd(), "node_modules", ".pnpm");
if (!fs.existsSync(pnpmDir)) {
  process.exit(0);
}

const targets = fs
  .readdirSync(pnpmDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name.startsWith("@opennextjs+aws@"))
  .map((entry) =>
    path.join(
      pnpmDir,
      entry.name,
      "node_modules",
      "@opennextjs",
      "aws",
      "dist",
      "build",
      "copyTracedFiles.js",
    ),
  )
  .filter((candidate) => fs.existsSync(candidate));

if (targets.length === 0) {
  console.warn("[patch-opennext-windows] No OpenNext aws copyTracedFiles.js target found.");
  process.exit(0);
}

const needle = /if \(e\.code !== "EEXIST"\) {\r?\n\s*throw e;\r?\n\s*}/m;
const existingPatchedNeedle =
  /if \(e\.code !== "EEXIST"\) {\r?\n\s*\/\/ desira-windows-symlink-fallback\r?\n\s*if \(e\.code === "EPERM" \|\| e\.code === "EINVAL" \|\| e\.code === "UNKNOWN"\) {\r?\n\s*if \(statSync\(from\)\.isDirectory\(\)\) {\r?\n\s*cpSync\(from, to, \{ recursive: true, force: true(?:, dereference: true)? \}\);\r?\n\s*}\r?\n\s*else {\r?\n\s*copyFileSync\(from, to\);\r?\n\s*}\r?\n\s*}\r?\n\s*else {\r?\n\s*throw e;\r?\n\s*}\r?\n\s*}/m;
const replacement = `if (e.code !== "EEXIST") {
                    // desira-windows-symlink-fallback
                    if (e.code === "EPERM" || e.code === "EINVAL" || e.code === "UNKNOWN") {
                        if (statSync(from).isDirectory()) {
                            try {
                                const resolvedTarget = path.resolve(path.dirname(from), symlink);
                                symlinkSync(resolvedTarget, to, "junction");
                            }
                            catch {
                                cpSync(from, to, { recursive: true, force: true, dereference: true });
                            }
                        }
                        else {
                            copyFileSync(from, to);
                        }
                    }
                    else {
                        throw e;
                    }
                }`;

let patchedCount = 0;
for (const targetPath of targets) {
  const source = fs.readFileSync(targetPath, "utf8");
  let patched = source;
  if (needle.test(patched)) {
    patched = patched.replace(needle, replacement);
  } else if (existingPatchedNeedle.test(patched)) {
    patched = patched.replace(existingPatchedNeedle, replacement);
  } else if (
    patched.includes("desira-windows-symlink-fallback") &&
    patched.includes("copyFileSync(from, to);") &&
    !patched.includes("cpSync(from, to, { recursive: true, force: true, dereference: true });")
  ) {
    continue;
  } else {
    continue;
  }

  fs.writeFileSync(targetPath, patched, "utf8");
  patchedCount += 1;
}

if (patchedCount > 0) {
  console.log(`[patch-opennext-windows] Applied Windows symlink fallback patch to ${patchedCount} file(s).`);
}
