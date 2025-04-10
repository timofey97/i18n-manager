const fs = require("fs");
const path = require("path");
const { translateNestedObject } = require('./utils/translate');
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

	langCode = langCode.toLowerCase();

	if (!/^[a-z]{2}$/.test(langCode)) {
		console.error(`❌ Invalid format: "${langCode}". Use a two-letter code like "fr", "pl", "id"`);
		process.exit(1);
	}

	if (!Object.keys(supportedLangs).includes(langCode)) {
		const suggestions = suggestCloseMatches(langCode, Object.keys(supportedLangs));
		console.error(`❌ Language code "${langCode}" is not supported.`);
		if (suggestions.length > 0) {
			console.log(`💡 Did you mean: ${suggestions.join(', ')}?`);
		}
		process.exit(1);
	}

	const newFilePath = path.join(i18nDir, `${langCode}.json`);
	if (fs.existsSync(newFilePath)) {
		console.error(`❌ File ${langCode}.json already exists!`);
		process.exit(1);
	}

	const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));

	console.log(`🌍 Translating full object to "${langCode}"...`);

	try {
		const translated = await translateNestedObject(baseData, supportedLangs[langCode] || langCode);
		fs.writeFileSync(newFilePath, JSON.stringify(translated, null, 2));
		console.log(`✅ Successfully created ${langCode}.json`);
	} catch (error) {
		console.error(`❌ Error creating language file: ${error.message}`);
		process.exit(1);
	}
}

module.exports = { createLanguageFile }; 