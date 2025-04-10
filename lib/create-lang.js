const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { distance } = require("fastest-levenshtein");

const translateApiUrl = "http://dev.dmanagerapp.com:8100/api/translate-object";

const supportedLangs = [
  "aa", "ab", "af", "ak", "am", "an", "ar", "as", "av", "ay", "az",
  "ba", "be", "bg", "bh", "bi", "bm", "bn", "bo", "br", "bs",
  "ca", "ce", "ch", "co", "cr", "cs", "cu", "cv", "cy",
  "da", "de", "dv", "dz",
  "ee", "el", "en", "eo", "es", "et", "eu",
  "fa", "ff", "fi", "fj", "fo", "fr", "fy",
  "ga", "gd", "gl", "gn", "gu", "gv",
  "ha", "he", "hi", "ho", "hr", "ht", "hu", "hy", "hz",
  "ia", "id", "ie", "ig", "ii", "ik", "io", "is", "it", "iu",
  "ja", "jv",
  "ka", "kg", "ki", "kj", "kk", "kl", "km", "kn", "ko", "kr", "ks", "ku", "kv", "kw", "ky",
  "la", "lb", "lg", "li", "ln", "lo", "lt", "lv",
  "mg", "mh", "mi", "mk", "ml", "mn", "mo", "mr", "ms", "mt", "my",
  "na", "nd", "ne", "ng", "nl", "nn", "no", "nr", "nv", "ny",
  "oc", "oj", "om", "or", "os",
  "pa", "pi", "pl", "ps", "pt",
  "qu",
  "rm", "rn", "ro", "ru", "rw",
  "sa", "sc", "sd", "sg", "sh", "si", "sk", "sl", "sm", "sn", "so", "sq", "sr", "ss", "st", "su", "sv", "sw",
  "ta", "te", "tg", "th", "ti", "tk", "tl", "tn", "to", "tr", "ts", "tt", "tw", "ty",
  "ug", "uk", "ur",
  "ve", "vi", "vo",
  "wa", "wo",
  "xh",
  "yi", "yo",
  "za", "zh", "zu"
];

function suggestCloseMatches(inputCode, list, maxSuggestions = 3) {
  return list
    .map((code) => ({ code, dist: distance(inputCode, code) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, maxSuggestions)
    .map((entry) => entry.code);
}

async function createLanguageFile(langCode, translationsPath = 'src/assets/i18n') {
  const i18nDir = path.resolve(translationsPath);
  const baseLang = "en";
  const basePath = path.join(i18nDir, `${baseLang}.json`);

  if (!fs.existsSync(i18nDir)) {
    console.error(`❌ Translations directory not found: ${i18nDir}`);
    process.exit(1);
  }

  langCode = langCode.toLowerCase();

  if (!/^[a-z]{2}$/.test(langCode)) {
    console.error(
      `❌ Invalid format: "${langCode}". Use a two-letter code like "fr", "pl", "id"`
    );
    process.exit(1);
  }

  if (!supportedLangs.includes(langCode)) {
    const suggestions = suggestCloseMatches(langCode, supportedLangs);
    console.error(`❌ Language code "${langCode}" is not supported.`);
    if (suggestions.length > 0) {
      console.log(`💡 Did you mean: ${suggestions.join(", ")}?`);
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

  try {
    const response = await axios.post(
      translateApiUrl,
      {
        object: baseData,
        to: langCode,
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const translated = response.data?.translatedObject;
    if (!translated) {
      console.error("❌ No translated object received");
      process.exit(1);
    }

    fs.writeFileSync(
      newFilePath,
      JSON.stringify(translated, null, 2),
      "utf-8"
    );
    console.log(`✅ File ${langCode}.json created successfully!`);
  } catch (error) {
    console.error(
      "❌ Translation error:",
      error.response?.data || error.message
    );
    process.exit(1);
  }
}

module.exports = { createLanguageFile }; 