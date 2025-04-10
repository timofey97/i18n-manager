const fs = require("fs");
const path = require("path");
const { translateNestedObject, countStrings } = require('./utils/translate-with-go');
const { supportedLangs } = require('./utils/languages');
const { distance } = require('fastest-levenshtein');

function suggestCloseMatches(inputCode, list, maxSuggestions = 3) {
	return list
		.map((code) => ({ code, dist: distance(inputCode, code) }))
		.sort((a, b) => a.dist - b.dist)
		.slice(0, maxSuggestions)
		.map((entry) => entry.code);
}

async function createLanguageFile(langCode, translationsPath = 'src/assets/i18n') {
	const i18nDir = path.resolve(translationsPath);
	const baseLang = 'en';
	const basePath = path.join(i18nDir, `${baseLang}.json`);

	if (!fs.existsSync(i18nDir)) {
		console.error(`❌ Translations directory not found: ${i18nDir}`);
		process.exit(1);
	}

	if (!fs.existsSync(basePath)) {
		console.error(`❌ Base language file (${basePath}) not found`);
		process.exit(1);
	}

	// Проверяем, есть ли код языка в supportedLangs
	if (!supportedLangs[langCode]) {
		console.error(`❌ Language code "${langCode}" is not supported.`);
		process.exit(1);
	}

	const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
	const targetPath = path.join(i18nDir, `${langCode}.json`);

	if (fs.existsSync(targetPath)) {
		console.error(`❌ Language file already exists: ${targetPath}`);
		process.exit(1);
	}

	console.log(`🌍 Creating translation file for ${langCode}...`);

	try {
		const totalStrings = countStrings(baseData);
		console.log(`📝 Found ${totalStrings} strings to translate`);
		const translatedData = await translateNestedObject(baseData, langCode, 1, totalStrings);
		fs.writeFileSync(targetPath, JSON.stringify(translatedData, null, 2));
		console.log(`✅ Successfully created ${targetPath}`);
	} catch (error) {
		console.error(`❌ Error creating translation file: ${error.message}`);
		process.exit(1);
	}
}

module.exports = { createLanguageFile }; 