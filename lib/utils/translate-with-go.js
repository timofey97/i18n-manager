const { spawn } = require('child_process');
const path = require('path');
const cliProgress = require('cli-progress');

const progressBar = new cliProgress.SingleBar({
	format: 'Translating |{bar}| {percentage}%',
	barCompleteChar: '\u2588',
	barIncompleteChar: '\u2591',
	hideCursor: true
});

/**
 * Translates text using Go translator
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr')
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<string>} - Translated text
 */
async function translateText(text, targetLang, current = 1, total = 1) {
	// Обновляем прогресс
	progressBar.update(current, { total });

	return new Promise((resolve, reject) => {
		const translatorPath = path.join(__dirname, '../../free-translate-api/translator');
		const child = spawn(translatorPath);

		const input = JSON.stringify({ text, to: targetLang });
		let output = '';

		child.stdout.on('data', (data) => {
			output += data.toString();
		});

		child.stderr.on('data', (err) => {
			console.error('⚠️ stderr:', err.toString());
		});

		child.on('error', reject);

		child.on('close', () => {
			try {
				const result = JSON.parse(output);
				if (result.status) {
					resolve(result.translatedText);
				} else {
					reject(new Error(result.message || 'Translation failed'));
				}
			} catch (e) {
				reject(new Error('Failed to parse Go output'));
			}
		});

		child.stdin.write(input);
		child.stdin.end();
	});
}

/**
 * Recursively translates all string values in a nested object
 * @param {Object} obj - Object to translate
 * @param {string} targetLang - Target language code
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<Object>} - Translated object
 */
async function translateNestedObject(obj, targetLang, current = 1, total = 1) {
	// Запускаем прогресс-бар
	progressBar.start(total, 0);

	const result = {};
	let translationCount = 0;

	for (const [key, value] of Object.entries(obj)) {
		if (typeof value === 'string') {
			translationCount++;
			result[key] = await translateText(value, targetLang, translationCount, total);
		} else if (typeof value === 'object' && value !== null) {
			if (Array.isArray(value)) {
				result[key] = await translateArray(value, targetLang, translationCount, total);
			} else {
				result[key] = await translateNestedObject(value, targetLang, translationCount, total);
			}
		} else {
			result[key] = value;
		}
	}

	// Останавливаем прогресс-бар
	progressBar.stop();
	return result;
}

/**
 * Translates all string elements in an array
 * @param {Array} arr - Array to translate
 * @param {string} targetLang - Target language code
 * @param {number} current - Current translation number
 * @param {number} total - Total number of translations
 * @returns {Promise<Array>} - Translated array
 */
async function translateArray(arr, targetLang, current = 1, total = 1) {
	let translationCount = 0;
	const result = await Promise.all(
		arr.map(async (item) => {
			if (typeof item === 'string') {
				translationCount++;
				return await translateText(item, targetLang, translationCount, total);
			} else if (typeof item === 'object' && item !== null) {
				if (Array.isArray(item)) {
					return await translateArray(item, targetLang, translationCount, total);
				} else {
					return await translateNestedObject(item, targetLang, translationCount, total);
				}
			}
			return item;
		})
	);
	return result;
}

module.exports = {
	translateText,
	translateNestedObject,
	translateArray
};
