const fs = require("fs");
const path = require("path");

const i18nDir = path.join(__dirname, "../src/assets/i18n");
const baseLang = "en";
const basePath = path.join(i18nDir, `${baseLang}.json`);

if (!fs.existsSync(basePath)) {
  console.error(`Base language file (${basePath}) not found`);
  process.exit(1);
}

const baseData = JSON.parse(fs.readFileSync(basePath, "utf-8"));
const languageFiles = fs
  .readdirSync(i18nDir)
  .filter((f) => f.endsWith(".json") && f !== `${baseLang}.json`);

function findMissingKeys(base, target, prefix = "") {
  let missing = [];

  for (const key in base) {
    const fullPath = prefix ? `${prefix}.${key}` : key;

    if (!(key in target)) {
      missing.push(fullPath);
    } else if (typeof base[key] === "object" && base[key] !== null) {
      missing.push(...findMissingKeys(base[key], target[key], fullPath));
    }
  }

  return missing;
}

console.log("🔍 Checking translation files...\n");

let hasMissing = false;

for (const file of languageFiles) {
  const filePath = path.join(i18nDir, file);
  const langData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  const missing = findMissingKeys(baseData, langData);

  if (missing.length > 0) {
    hasMissing = true;
    console.log(`❌ Missing in ${file}:`);
    missing.forEach((key) => console.log(`  - ${key}`));
    console.log("");
  } else {
    console.log(`✅ ${file} is up to date.\n`);
  }
}

if (!hasMissing) {
  console.log("🎉 All translation files are in sync with the base language!");
}
