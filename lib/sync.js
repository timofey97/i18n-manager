const fs = require("fs");
const path = require("path");
const axios = require("axios");

const translateApiUrl = "http://dev.dmanagerapp.com:8100/api/translate";

const i18nDir = path.join(process.cwd(), "src/assets/i18n");
const baseLang = "en";
const basePath = path.join(i18nDir, `${baseLang}.json`);

const langMap = {
  bg: "bg", cs: "cs", cz: "cs", de: "de", es: "es", fi: "fi", fr: "fr",
  hr: "hr", hu: "hu", it: "it", nl: "nl", pl: "pl", rs: "sr", ru: "ru",
  se: "sv", si: "sl", tr: "tr"
};

function getFlatKeys(obj, prefix = "") {
  let keys = [];
  for (const key in obj) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      keys = keys.concat(getFlatKeys(obj[key], path));
    } else {
      keys.push({ key: path, value: obj[key] });
    }
  }
  return keys;
}

function setValueByPath(obj, path, value) {
  const keys = path.split(".");
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) current[keys[i]] = {};
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
}

function getValueByPath(obj, path) {
  return path.split(".").reduce((o, k) => (o ? o[k] : undefined), obj);
}

async function translate(text, toLang) {
  try {
    const response = await axios.post(
      translateApiUrl,
      {
        text: text.trim(),
        to: toLang,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    return response.data?.translatedText || "";
  } catch (error) {
    console.error(`❌ Translation error: ${error.message}`);
    return "";
  }
}

async function syncTranslations(translationsPath = 'src/assets/i18n') {
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

  console.log("🌍 Auto-translating missing keys...\n");

  const baseFlat = getFlatKeys(baseData);
  let totalTranslated = 0;

  for (const file of languageFiles) {
    const filePath = path.join(i18nDir, file);
    const fileLang = file.replace(".json", "");
    const targetLang = langMap[fileLang];

    if (!targetLang) {
      console.log(`⚠️ Skipping ${fileLang}.json - language not supported`);
      continue;
    }

    const langData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const missing = [];

    for (const { key, value } of baseFlat) {
      const existing = getValueByPath(langData, key);
      if (existing === undefined) {
        missing.push({ key, value });
      }
    }

    if (missing.length === 0) {
      console.log(`✅ ${fileLang}.json - all keys present`);
      continue;
    }

    console.log(
      `🔤 ${fileLang}.json → translating ${missing.length} key(s)...`
    );

    for (const { key, value } of missing) {
      const translated = await translate(value, targetLang);
      setValueByPath(langData, key, translated);
    }

    fs.writeFileSync(filePath, JSON.stringify(langData, null, 2), "utf-8");
    totalTranslated += missing.length;
  }

  console.log(`\n✅ Done! ${totalTranslated} key(s) translated and written.`);
}

module.exports = { syncTranslations }; 