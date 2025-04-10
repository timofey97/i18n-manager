const fs = require('fs');
const path = require('path');

function transformTranslations(translationsPath = 'i18n', langCode = null) {
	const i18nDir = path.resolve(translationsPath);

	if (!fs.existsSync(i18nDir)) {
		console.error(`❌ Translations directory not found: ${i18nDir}`);
		process.exit(1);
	}

	const languageFiles = fs
		.readdirSync(i18nDir)
		.filter((f) => f.endsWith('.json'))
		.filter((f) => !langCode || f === `${langCode}.json`);

	if (langCode && languageFiles.length === 0) {
		console.error(`❌ Language file not found: ${langCode}.json`);
		process.exit(1);
	}

	for (const file of languageFiles) {
		const filePath = path.join(i18nDir, file);
		const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		const transformed = {};

		for (const [key, value] of Object.entries(data)) {
			const parts = key.split('.');
			let current = transformed;

			for (let i = 0; i < parts.length - 1; i++) {
				const part = parts[i];
				if (!current[part]) {
					current[part] = {};
				}
				current = current[part];
			}

			current[parts[parts.length - 1]] = value;
		}

		fs.writeFileSync(filePath, JSON.stringify(transformed, null, 2));
		console.log(`✅ Transformed ${file}`);
	}

	console.log('\n✨ All translation files have been transformed!');
}

module.exports = { transformTranslations };
