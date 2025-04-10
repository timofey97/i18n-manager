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

function checkTranslations(translationsPath, baseLang = 'en') {
	console.log('🚀 ~ checkTranslations ~ translationsPath:', translationsPath);
	const i18nDir = path.resolve(translationsPath);
	const basePath = path.join(i18nDir, `${baseLang}.json`);

	if (!fs.existsSync(i18nDir)) {
		console.error(`❌ Translations directory not found: ${i18nDir}`);
		process.exit(1);
	}

	if (!fs.existsSync(basePath)) {
		console.error(`❌ Base language file (${basePath}) not found`);
		process.exit(1);
	}

	const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
	const languageFiles = fs.readdirSync(i18nDir).filter((f) => f.endsWith('.json'));

	console.log('🔍 Checking translation files...\n');

	let hasMissing = false;
	let totalMissing = 0;

	for (const file of languageFiles) {
		if (file === `${baseLang}.json`) continue;

		const filePath = path.join(i18nDir, file);
		const langData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

		// Check for keys missing in translation file
		const missingInTranslation = findMissingKeys(baseData, langData);
		if (missingInTranslation.length > 0) {
			hasMissing = true;
			totalMissing += missingInTranslation.length;
			console.log(`\n❌ Missing ${missingInTranslation.length} keys in ${file}:`);
			missingInTranslation.forEach((key) => console.log(`  - ${key}`));
		}
	}

	if (!hasMissing) {
		console.log('\n✅ All translation files are up to date!');
	} else {
		console.log(`\n📊 Total missing keys: ${totalMissing}`);
		console.log("\n💡 Use the 'sync' command to automatically translate missing keys");
	}
}

module.exports = { checkTranslations }; 