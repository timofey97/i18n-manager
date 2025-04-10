const fs = require("fs");
const path = require("path");

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

function checkTranslations(translationsPath = 'src/assets/i18n') {
  const i18nDir = path.resolve(translationsPath);
  const baseLang = "en";
  const basePath = path.join(i18nDir, `${baseLang}.json`);

  if (!fs.existsSync(i18nDir)) {
    console.error(`❌ Translations directory not found: ${i18nDir}`);
    process.exit(1);
  }

  if (!fs.existsSync(basePath)) {
    console.error(`❌ Base language file (${basePath}) not found`);
    process.exit(1);
  }

  const baseData = JSON.parse(fs.readFileSync(basePath, "utf-8"));
  const languageFiles = fs
    .readdirSync(i18nDir)
    .filter((f) => f.endsWith(".json") && f !== `${baseLang}.json`);

  console.log("🔍 Checking translation files...\n");

  let hasMissing = false;
  let totalMissing = 0;

  for (const file of languageFiles) {
    const filePath = path.join(i18nDir, file);
    const langData = JSON.parse(fs.readFileSync(filePath, "utf-8"));

    const missing = findMissingKeys(baseData, langData);

    if (missing.length > 0) {
      hasMissing = true;
      totalMissing += missing.length;
      console.log(`❌ Missing keys in ${file}:`);
      missing.forEach((key) => console.log(`  - ${key}`));
      console.log("");
    } else {
      console.log(`✅ ${file} is up to date.\n`);
    }
  }

  if (!hasMissing) {
    console.log("🎉 All translation files are in sync with the base language!");
  } else {
    console.log(`⚠️ Total of ${totalMissing} keys missing in ${languageFiles.length} files.`);
    console.log("💡 Use the 'sync' command to automatically translate missing keys.");
  }
}

module.exports = { checkTranslations }; 