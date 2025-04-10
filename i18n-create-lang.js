const fs = require("fs");
const path = require("path");
const axios = require("axios");
const readline = require("readline");
const { distance } = require("fastest-levenshtein");

const i18nDir = path.join(__dirname, "../src/assets/i18n");
const baseLang = "en";
const basePath = path.join(i18nDir, `${baseLang}.json`);
const translateApiUrl = "http://dev.dmanagerapp.com:8100/api/translate-object";

if (!fs.existsSync(basePath)) {
  console.error(`❌ Base language file (${basePath}) not found`);
  process.exit(1);
}

const supportedLangs = [
  "aa",
  "ab",
  "af",
  "ak",
  "am",
  "an",
  "ar",
  "as",
  "av",
  "ay",
  "az",
  "ba",
  "be",
  "bg",
  "bh",
  "bi",
  "bm",
  "bn",
  "bo",
  "br",
  "bs",
  "ca",
  "ce",
  "ch",
  "co",
  "cr",
  "cs",
  "cu",
  "cv",
  "cy",
  "da",
  "de",
  "dv",
  "dz",
  "ee",
  "el",
  "en",
  "eo",
  "es",
  "et",
  "eu",
  "fa",
  "ff",
  "fi",
  "fj",
  "fo",
  "fr",
  "fy",
  "ga",
  "gd",
  "gl",
  "gn",
  "gu",
  "gv",
  "ha",
  "he",
  "hi",
  "ho",
  "hr",
  "ht",
  "hu",
  "hy",
  "hz",
  "ia",
  "id",
  "ie",
  "ig",
  "ii",
  "ik",
  "io",
  "is",
  "it",
  "iu",
  "ja",
  "jv",
  "ka",
  "kg",
  "ki",
  "kj",
  "kk",
  "kl",
  "km",
  "kn",
  "ko",
  "kr",
  "ks",
  "ku",
  "kv",
  "kw",
  "ky",
  "la",
  "lb",
  "lg",
  "li",
  "ln",
  "lo",
  "lt",
  "lv",
  "mg",
  "mh",
  "mi",
  "mk",
  "ml",
  "mn",
  "mo",
  "mr",
  "ms",
  "mt",
  "my",
  "na",
  "nd",
  "ne",
  "ng",
  "nl",
  "nn",
  "no",
  "nr",
  "nv",
  "ny",
  "oc",
  "oj",
  "om",
  "or",
  "os",
  "pa",
  "pi",
  "pl",
  "ps",
  "pt",
  "qu",
  "rm",
  "rn",
  "ro",
  "ru",
  "rw",
  "sa",
  "sc",
  "sd",
  "sg",
  "sh",
  "si",
  "sk",
  "sl",
  "sm",
  "sn",
  "so",
  "sq",
  "sr",
  "ss",
  "st",
  "su",
  "sv",
  "sw",
  "ta",
  "te",
  "tg",
  "th",
  "ti",
  "tk",
  "tl",
  "tn",
  "to",
  "tr",
  "ts",
  "tt",
  "tw",
  "ty",
  "ug",
  "uk",
  "ur",
  "ve",
  "vi",
  "vo",
  "wa",
  "wo",
  "xh",
  "yi",
  "yo",
  "za",
  "zh",
  "zu",
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function suggestCloseMatches(inputCode, list, maxSuggestions = 3) {
  return list
    .map((code) => ({ code, dist: distance(inputCode, code) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxSuggestions)
    .map((entry) => entry.code);
}

function createLanguageFile(langCode) {
  langCode = langCode.toLowerCase();

  if (!/^[a-z]{2}$/.test(langCode)) {
    console.error(
      `❌ Invalid format: "${langCode}". Use 2-letter code like "fr", "pl", "id"`,
    );
    process.exit(1);
  }

  if (!supportedLangs.includes(langCode)) {
    const suggestions = suggestCloseMatches(langCode, supportedLangs);
    console.error(`❌ Language code "${langCode}" is not supported.`);
    if (suggestions.length > 0) {
      console.log(`💡 May be you mention: ${suggestions.join(", ")}?`);
    }
    process.exit(1);
  }

  const newFilePath = path.join(i18nDir, `${langCode}.json`);
  if (fs.existsSync(newFilePath)) {
    console.error(`❌ File ${langCode}.json already exists!`);
    process.exit(1);
  }

  const baseData = JSON.parse(fs.readFileSync(basePath, "utf-8"));

  console.log(`🌍 Translating full object to "${langCode}"...`);

  axios
    .post(
      translateApiUrl,
      {
        object: baseData,
        to: langCode,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    )
    .then((response) => {
      const translated = response.data?.translatedObject;
      if (!translated) {
        console.error("❌ No translated object returned");
        process.exit(1);
      }

      fs.writeFileSync(
        newFilePath,
        JSON.stringify(translated, null, 2),
        "utf-8",
      );
      console.log(`✅ Created ${langCode}.json successfully!`);
      rl.close();
    })
    .catch((error) => {
      console.error(
        "❌ Translation failed:",
        error.response?.data || error.message,
      );
      process.exit(1);
    });
}

rl.question("🌐 Enter new language code (e.g. fr, pl, id): ", (langCode) => {
  createLanguageFile(langCode.trim());
});
