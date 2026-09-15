import fs from "node:fs";

const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
const tauriConfig = JSON.parse(fs.readFileSync("src-tauri/tauri.conf.json", "utf8"));
const cargoToml = fs.readFileSync("src-tauri/Cargo.toml", "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];

const versions = {
  packageJson: packageJson.version,
  tauriConfig: tauriConfig.version,
  cargoToml: cargoVersion
};

const unique = new Set(Object.values(versions));
if (unique.size !== 1 || unique.has(undefined)) {
  console.error("Version mismatch detected:", versions);
  process.exit(1);
}

console.log(`Version consistency OK: ${packageJson.version}`);
