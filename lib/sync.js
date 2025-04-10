const fs = require("fs");
const path = require("path");
const { translateText } = require('./utils/translate-with-go');
const { supportedLangs } = require('./utils/languages');
const cliProgress = require('cli-progress');

function getFlatKeys(obj, prefix = '') {
	let keys = [];
	for (const key in obj) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (typeof obj[key] === 'object' && obj[key] !== null) {
			keys = keys.concat(getFlatKeys(obj[key], path));
		} else {
			keys.push({ key: path, value: obj[key] });
		}
	}
	return keys;
}

function setValueByPath(obj, path, value) {
	const keys = path.split('.');
	let current = obj;
	for (let i = 0; i < keys.length - 1; i++) {
		if (!current[keys[i]]) current[keys[i]] = {};
		current = current[keys[i]];
	}
	current[keys[keys.length - 1]] = value;
}

function getValueByPath(obj, path) {
	return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
}

async function syncTranslations(translationsPath = 'src/assets/i18n', baseLang = 'en') {
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

	console.log('🌍 Auto-translating missing keys...\n');

	const baseData = JSON.parse(fs.readFileSync(basePath, 'utf-8'));
	const languageFiles = fs.readdirSync(i18nDir).filter((f) => f.endsWith('.json') && f !== `${baseLang}.json`);

	const baseFlat = getFlatKeys(baseData);
	let totalTranslated = 0;

	for (const file of languageFiles) {
		const filePath = path.join(i18nDir, file);
		const fileLang = file.replace('.json', '');
		const langData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
		const missing = [];

		for (const { key, value } of baseFlat) {
			if (getValueByPath(langData, key) === undefined) {
				missing.push({ key, value });
			}
		}

		if (missing.length > 0) {
			console.log(`📝 Found ${missing.length} missing keys in ${file}`);

			// Create progress bar for this language
			const progressBar = new cliProgress.SingleBar({
				format: '🌍 Translating {bar} {percentage}% | {value}/{total} keys | ETA: {eta}s',
				barCompleteChar: '\u2588',
				barIncompleteChar: '\u2591',
				hideCursor: true
			});

			progressBar.start(missing.length, 0);

			for (let i = 0; i < missing.length; i++) {
				const { key, value } = missing[i];
				try {
					if (!supportedLangs[fileLang]) {
						console.error(`❌ Language code "${fileLang}" is not supported. Skipping translation.`);
						continue;
					}
					const translated = await translateText(value, fileLang);
					setValueByPath(langData, key, translated);
					totalTranslated++;
				} catch (error) {
					console.error(`❌ Error translating key "${key}": ${error.message}`);
				}
				progressBar.update(i + 1);
			}

			progressBar.stop();
			fs.writeFileSync(filePath, JSON.stringify(langData, null, 2));
			console.log(`✅ Updated ${file}\n`);
		} else {
			console.log(`✅ ${file} is up to date.\n`);
		}
	}

	if (totalTranslated > 0) {
		console.log(`🎉 Successfully translated ${totalTranslated} keys!`);
	} else {
		console.log('✨ All translation files are already in sync!');
	}
}

module.exports = { syncTranslations };